// import React, { useState, useEffect } from "react";
// import PaymentPage from './PaymentPage';

// const RateCard = () => {
//   const rateCardSlabs = [
//     { plan: "Launch Plan", ratePerMinute: 15, totalAmt: 363000, totalMin: `0-25000` },
//     { plan: "Growth Plan", ratePerMinute: 9, totalAmt: 435600, totalMin: `25001-49000` },
//     { plan: "Ascend Plan", ratePerMinute: 8, totalAmt: 580800, totalMin: `49001-73000` },
//     { plan: "Pinnacle Plan", ratePerMinute: 7, totalAmt: 847000, totalMin: `73001-121000` },
//     { plan: "Elite Plan", ratePerMinute: 6, totalAmt: 728904, totalMin: `More than 121000` },
//   ];

//   const [customMinutes, setCustomMinutes] = useState("");
//   const [customRate, setCustomRate] = useState(""); 
//   const [totalAmount, setTotalAmount] = useState(null);
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const [customPlanDetails, setCustomPlanDetails] = useState(null);

//   useEffect(() => {
//     let rate = 0;

//     if (customMinutes) {
//       if (customMinutes <= 25000) {
//         rate = 15;
//       } else if (customMinutes <= 49000) {
//         rate = 9;
//       } else if (customMinutes <= 73000) {
//         rate = 8;
//       } else if (customMinutes <= 121000) {
//         rate = 7;
//       } else if (customMinutes > 121000) {
//         rate = 6;
//       }
//     }

//     setCustomRate(rate);

//     if (customMinutes && rate) {
//       const total = customMinutes * rate;
//       setTotalAmount(total);
//     } else {
//       setTotalAmount(null);
//     }
//   }, [customMinutes]);

//   const handleCustomPlanPayment = () => {
//     setCustomPlanDetails({
//       totalAmountFor22Days: Math.round((totalAmount + totalAmount * 0.18)).toFixed(2) ,
//       totalMinutesPerMonth: customMinutes,
//     });
//   };

//   if (selectedPlan) {
//     return <PaymentPage plan={selectedPlan.plan} totalAmt={selectedPlan.totalAmt} />;
//   }

//   if (customPlanDetails) {
//     return (
//       <PaymentPage
//         plan="Custom Plan"
//         totalAmt={customPlanDetails.totalAmountFor22Days}
//         totalMinutes={customPlanDetails.totalMinutesPerMonth}
//       />
//     );
//   }

//   return (
//     <div className="p-6 bg-[#1E1E1E] shadow-md rounded-lg ">
//       <h2 className="text-2xl font-bold mb-4">Available Plans</h2>

//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
//         {rateCardSlabs.map((slab, index) => (
//           <div
//             key={index}
//             className="p-3 border rounded-lg bg-gray-500"
//           >
//             <h3 className="font-bold mb-1.5">{slab.plan}</h3>
//             <p>Rate: ₹{slab.ratePerMinute} per minute</p>
//             <p>Minutes: {slab.totalMin}</p>
//           </div>
//         ))}
//       </div>

//       <div className="mt-4 gap-2">
//         <h3 className="font-bold mb-2">Custom Minutes</h3>
//         <input
//           type="number"
//           value={customMinutes}
//           onChange={(e) => {
//             const value = e.target.value;
//             setCustomMinutes(value === "" ? "" : Math.max(1, Number(value)));
//           }}
//           placeholder="Minutes"
//           className="w-1/3 px-4 py-2 border rounded-md text-black"
//         />
//         <span className="text-white ml-2 mr-1.5">x</span>

//         <span className="w-1/3 px-4 py-2 border rounded-md text-white">
//           ₹{customRate}
//         </span>

//         {totalAmount !== null && (
//           <div className="mt-4 text-white font-semibold">
//             <h3>Amount: ₹{totalAmount}</h3>
//             <h3>18% GST Amount: ₹{((totalAmount * 0.18)).toFixed(2)}</h3>
//             <h3>Total Amount: ₹{Math.round((totalAmount + totalAmount * 0.18)).toFixed(2)} including GST</h3>
//             <h3>Total Minutes: {customMinutes} minutes</h3>
//             <button
//               onClick={handleCustomPlanPayment}
//               className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
//             >
//               Pay 
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RateCard;



import React, { useState, useEffect } from "react";
import PaymentPage from './PaymentPage';
import axios from "axios";


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const RateCard = () => {
  const [rateCardSlabs, setRateCardSlabs] = useState([]);
  const [customMinutes, setCustomMinutes] = useState("");
  const [customRate, setCustomRate] = useState(""); 
  const [totalAmount, setTotalAmount] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [customPlanDetails, setCustomPlanDetails] = useState(null);



  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/getPlans/plans/678f44a79886848a249cfb27`);
      const plans = response.data.map((plan) => ({
        name: plan.name,
        ratePerMinute: plan.pricePerMinute,
        totalMin: plan.range.end ? `${plan.range.start}-${plan.range.end}` : `More than ${plan.range.start}`,
        start: plan.range.start,
        end: plan.range.end,
      }));
      setRateCardSlabs(plans);
    } catch (error) {
      console.error("Error fetching plans:", error.message);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);


  useEffect(() => {
    let rate = 0;

    if (customMinutes) {
      for (const slab of rateCardSlabs) {
        const start = slab.start;
        const end = slab.end ?? Infinity; 

        if (customMinutes >= start && customMinutes <= end) {
          rate = slab.ratePerMinute;
          break;
        }
      }
    }

    setCustomRate(rate);

    if (customMinutes && rate) {
      const total = customMinutes * rate;
      setTotalAmount(total);
    } else {
      setTotalAmount(null);
    }
  }, [customMinutes]);

  const handleCustomPlanPayment = () => {
    setCustomPlanDetails({
      totalAmountFor22Days: Math.round((totalAmount + totalAmount * 0.18)).toFixed(2) ,
      totalMinutesPerMonth: customMinutes,
    });
  };

  if (selectedPlan) {
    return <PaymentPage plan={selectedPlan.plan} totalAmt={selectedPlan.totalAmt} />;
  }

  if (customPlanDetails) {
    return (
      <PaymentPage
        plan="Custom Plan"
        totalAmt={customPlanDetails.totalAmountFor22Days}
        totalMinutes={customPlanDetails.totalMinutesPerMonth}
      />
    );
  }

  return (
    <div className="p-6 bg-[#1E1E1E] shadow-md rounded-lg ">
      <h2 className="text-2xl font-bold mb-4">Available Plans</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
        {rateCardSlabs.map((slab, index) => (
          <div
            key={index}
            className="p-3 border rounded-lg bg-gray-500"
          >
            <h3 className="font-bold mb-1.5">{slab.name}</h3>
            <p>Rate: ₹{slab.ratePerMinute} per minute</p>
            <p>Minutes: {slab.totalMin}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 gap-2">
        <h3 className="font-bold mb-2">Custom Minutes</h3>
        <input
          type="number"
          value={customMinutes}
          onChange={(e) => {
            const value = e.target.value;
            setCustomMinutes(value === "" ? "" : Math.max(1, Number(value)));
          }}
          placeholder="Minutes"
          className="w-1/3 px-4 py-2 border rounded-md text-black"
        />
        <span className="text-white ml-2 mr-1.5">x</span>

        <span className="w-1/3 px-4 py-2 border rounded-md text-white">
          ₹{customRate}
        </span>

        {totalAmount !== null && (
          <div className="mt-4 text-white font-semibold">
            <h3>Amount: ₹{totalAmount}</h3>
            <h3>18% GST Amount: ₹{((totalAmount * 0.18)).toFixed(2)}</h3>
            <h3>Total Amount: ₹{Math.round((totalAmount + totalAmount * 0.18)).toFixed(2)} including GST</h3>
            <h3>Total Minutes: {customMinutes} minutes</h3>
            <button
              onClick={handleCustomPlanPayment}
              className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Pay 
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateCard;
