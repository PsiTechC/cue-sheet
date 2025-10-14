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
    <div className="bg-white">
      {/* Header Section */}
      <div className="border-b border-surface-200 px-6 md:px-8 py-5 bg-surface-50">
        <h2 className="text-xl font-semibold text-surface-900">Pricing Plans</h2>
        <p className="text-sm text-surface-600 mt-1">Select a plan based on your usage requirements</p>
      </div>

      {/* Plans Grid */}
      <div className="p-6 md:p-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {rateCardSlabs.map((slab, index) => {
            // Calculate total amount for this plan (using midpoint of range)
            const avgMinutes = slab.end ? Math.floor((slab.start + slab.end) / 2) : slab.start;
            const planTotal = avgMinutes * slab.ratePerMinute;
            const totalWithGST = Math.round(planTotal + planTotal * 0.18);

            return (
              <div
                key={index}
                onClick={() => setSelectedPlan({
                  plan: slab.name,
                  totalAmt: totalWithGST,
                  minutes: avgMinutes,
                  rate: slab.ratePerMinute
                })}
                className="border border-surface-300 hover:border-secondary-400 bg-white p-6 rounded transition-all duration-150 hover:shadow-lg group cursor-pointer"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-base text-surface-800 mb-1">{slab.name}</h3>
                  <div className="h-0.5 w-12 bg-secondary-500 mt-2"></div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-surface-900">₹{slab.ratePerMinute}</span>
                    <span className="text-sm text-surface-500">/minute</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-200">
                  <div className="flex items-center gap-2 text-sm text-surface-600 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-500"></span>
                    <span>{slab.totalMin} minutes</span>
                  </div>
                  <button className="w-full bg-secondary-50 hover:bg-secondary-100 text-secondary-700 py-2 px-4 rounded text-sm font-medium transition-colors">
                    Select Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Plan Section */}
        <div className="border-t border-surface-200 pt-8">
          <div className="mb-5">
            <h3 className="font-semibold text-lg text-surface-900 mb-1">Custom Plan</h3>
            <p className="text-sm text-surface-600">Calculate pricing for your specific requirements</p>
          </div>

          <div className="bg-surface-50 p-6 rounded border border-surface-200">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">Minutes Required</label>
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomMinutes(value === "" ? "" : Math.max(1, Number(value)));
                  }}
                  placeholder="Enter minutes"
                  className="w-full px-4 py-2.5 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">Rate Per Minute</label>
                <div className="px-4 py-2.5 border border-surface-300 bg-surface-100 rounded text-surface-900 text-sm font-semibold">
                  ₹{customRate || '0'}
                </div>
              </div>
            </div>

            {totalAmount !== null && (
              <div className="bg-white border border-surface-200 rounded p-5">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-surface-200">
                    <tr>
                      <td className="py-2.5 text-surface-600">Base Amount</td>
                      <td className="py-2.5 text-right font-medium text-surface-900">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-surface-600">GST (18%)</td>
                      <td className="py-2.5 text-right font-medium text-surface-900">₹{((totalAmount * 0.18)).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-surface-600">Total Minutes</td>
                      <td className="py-2.5 text-right font-medium text-surface-900">{customMinutes} minutes</td>
                    </tr>
                    <tr className="border-t-2 border-surface-300">
                      <td className="py-3 font-semibold text-surface-900">Total Payable</td>
                      <td className="py-3 text-right text-xl font-bold text-surface-900">₹{Math.round((totalAmount + totalAmount * 0.18)).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <button
                  onClick={handleCustomPlanPayment}
                  className="w-full mt-5 bg-secondary-600 hover:bg-secondary-700 text-white py-2.5 px-5 rounded font-medium text-sm transition-colors duration-150 uppercase tracking-wide"
                >
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateCard;
