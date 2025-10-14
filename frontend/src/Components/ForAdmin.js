
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Alert from './Alert';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ForAdmin = () => {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState({ name: '', pricePerMinute: '', rangeStart: '', rangeEnd: '', serviceId: '', isLast: false, scheduleTime: new Date() });
  const [planMessage, setPlanMessage] = useState('');
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [addUServicePlans, setAddUServicePlans] = useState([]);
  const [showAddPlanInputs, setShowAddPlanInputs] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceMessage, setNewServiceMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deleteDate, setDeleteDate] = useState(new Date());
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);

  const [addUServicePlan, setAddUServicePlan] = useState({
    name: '',
    pricePerMinute: '',
    rangeStart: '',
    rangeEnd: '',
    serviceId: '',
    isLast: false,
    scheduleTime: new Date(),
    userId: ''
  });




  useEffect(() => {
    const fetchUsersAndServices = async () => {
      try {
        if (tab === 'users') {
          const userResponse = await axios.get(`${API_BASE_URL}/api/admin/users`, {
            withCredentials: true
          });
          setUsers(userResponse.data);
        } else if (tab === 'addPlan' || tab === 'newPlan' || tab == 'addUService') {
          const serviceResponse = await axios.get(`${API_BASE_URL}/api/add/services`, {
            withCredentials: true, credentials: 'include',
          });
          setServices(serviceResponse.data);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
        setAlertMessage('Error fetching data');
        setAlertType('error');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);
      }
    };

    fetchUsersAndServices();
  }, [tab]);



  const handleDateChange = (date) => {
    setPlan({ ...plan, scheduleTime: date });
  };

  const openDatePickerModal = () => {
    setShowDatePicker(true);
  };
  const handleSetDateTime = () => {
    console.log(`Date and Time set to: ${plan.scheduleTime.toLocaleString()}`);
    setShowDatePicker(false);

  };


  const toggleAccess = async (userId, currentAccess) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/add/update-access/${userId}`, {
        isAccess: !currentAccess
      }, {
        withCredentials: true
      });

      if (response.status === 200) {
        setUsers(users.map(user => user._id === userId ? { ...user, isAccess: !user.isAccess } : user));
        setAlertMessage(`Access for ${response.data.user.email} has been ${response.data.user.isAccess ? 'granted' : 'revoked'}.`);
        setAlertType('warning');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);
      }
    } catch (error) {
      alert('Failed to update access: ' + (error.response?.data?.message || error.message));
      setAlertMessage('Failed to update access: ' + (error.response?.data?.message || error.message));
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };



  const handleAddService = async (e) => {
    e.preventDefault();
    setNewServiceMessage('');

    if (!newServiceName.trim()) {
      setNewServiceMessage('Service name is required.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/add/services`, { serviceName: newServiceName }, {
        withCredentials: true
      });

      setNewServiceMessage(response.data.message);
      setNewServiceName(''); // Reset input

      const serviceResponse = await axios.get(`${API_BASE_URL}/api/add/services`, {
        withCredentials: true
      });
      setServices(serviceResponse.data);

    } catch (error) {
      setNewServiceMessage('Error adding service: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchPlansByService = async (serviceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/add/plans/${serviceId}`, {
        withCredentials: true
      });
      console.log('Fetched Plans:', response.data);
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error.response?.data || error.message);
      setPlans([]);
    }
  };

  const handlePlanDelete = async (planId, scheduleTime) => {
    setPlanMessage(''); // Reset any existing messages

    // Validate `scheduleTime`
    if (!scheduleTime || isNaN(new Date(scheduleTime).getTime())) {
      setAlertMessage('Please select a valid date and time before deleting.');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      return;
    }

    const formattedScheduleTime = new Date(scheduleTime).toISOString(); // Format the date

    console.log('Deleting Plan:', { planId, scheduleTime: formattedScheduleTime }); // Debugging

    try {
      // Send request to delete the plan with scheduleTime
      const response = await axios.delete(
        `${API_BASE_URL}/api/add/plans/${planId}`,
        {
          withCredentials: true,
          data: {
            scheduleTime: formattedScheduleTime, // Pass scheduleTime as part of the body
          },
        }
      );

      setPlanMessage(response.data.message); // Update the message
      setPlans(plans.filter((p) => p._id !== planId)); // Remove the plan from the state
      setAlertMessage('Plan deletion scheduled successfully!');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    } catch (error) {
      console.error('Error deleting plan:', error.response?.data || error.message);
      setAlertMessage('Error deleting plan: ' + (error.response?.data?.message || error.message));
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };



  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setPlanMessage('');

    if (!plan.scheduleTime) {
      setPlanMessage('Please select a date and time.');
      return;
    }
    const formattedDate = plan.scheduleTime.toISOString();

    const payload = {
      name: plan.name,
      pricePerMinute: parseFloat(plan.pricePerMinute),
      range: {
        start: parseInt(plan.rangeStart, 10),
        end: plan.isLast ? null : parseInt(plan.rangeEnd, 10),
      },
      serviceId: plan.serviceId,
      isLast: plan.isLast,
      scheduleTime: formattedDate,
    };

    console.log('Submitting Plan:', plan);
    if (!payload.serviceId || !payload.name || !payload.pricePerMinute || payload.range.start == null) {
      setPlanMessage('Please fill out all required fields.');
      setAlertMessage('Please fill out all required fields.');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      return;
    }
    try {
      if (plan._id) {
        const response = await axios.put(`${API_BASE_URL}/api/add/eplans/${plan._id}`, payload, {
          withCredentials: true
        });
        setAlertMessage(response.data.message);
        setAlertType('success');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);
        const updatedPlans = plans.map((p) =>
          p._id === plan._id ? { ...p, ...payload, range: payload.range } : p
        );
        setPlans(updatedPlans);
        setAlertMessage('Plan saved successfully!');
        setAlertType('success');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);

      } else {
        const response = await axios.post(`${API_BASE_URL}/api/add/plans`, payload, {
          withCredentials: true, 
        });
        setAlertMessage(response.data.message);
        setAlertType('success');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);
        setPlans([...plans, response.data.plan]);
      }

      setPlan({
        name: '',
        pricePerMinute: '',
        rangeStart: '',
        rangeEnd: '',
        serviceId: '',
        isLast: false,
        scheduleTime: new Date()
      });
      setShowAddPlanInputs(false);
    } catch (error) {
      setAlertMessage('Error submitting plan: ' + (error.response?.data?.message || error.message));
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };

  if (loading && tab === 'users') return <div>Loading...</div>;
  if (error && tab === 'users') return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-3 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <button
            className={`px-4 py-2 rounded-t-lg ${tab === 'users' ? 'bg-gray-200 font-semibold' : 'bg-gray-100'
              }`}
            onClick={() => setTab('users')}
          >
            Manage Users
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg ${tab === 'newPlan' ? 'bg-gray-200 font-semibold' : 'bg-gray-100'
              }`}
            onClick={() => setTab('newPlan')}
          >
            Edit/Add Current Plans
          </button>
          <button
            onClick={() => setTab('addService')}
            className={`px-4 py-2 rounded-t-lg ${tab === 'addService' ? 'bg-gray-200 font-semibold' : 'bg-gray-100'
              }`}
          >
            Add Service
          </button>
        </div>

        {tab === 'users' && (
          <div>
            <ul className="text-left">
              {users.map((user) => (
                <li key={user._id} className="mb-2 p-2 border-b border-gray-200 ">
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>ID:</strong> {user._id}
                  </p>
                  <p><strong>Access:</strong> {user.isAccess ? 'Enabled' : 'Disabled'}</p>
                  <button
                    className={`px-2 py-1 text-xs rounded ${user.isAccess ? 'bg-red-500' : 'bg-green-500'} text-white`}
                    onClick={() => toggleAccess(user._id, user.isAccess)}
                  >
                    {user.isAccess ? 'Revoke' : 'Grant'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'newPlan' && (
          <div>
            <form className="text-left">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Service</label>
                <select
                  value={plan.serviceId}
                  onChange={async (e) => {
                    const selectedServiceId = e.target.value;
                    setPlan({ ...plan, serviceId: selectedServiceId });

                    if (selectedServiceId) {
                      fetchPlansByService(selectedServiceId);
                    } else {
                      setPlans([]);
                    }
                  }}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select a Service</option>
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.serviceName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-center mt-4">
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={openDatePickerModal}
                >
                  Select Date and Time
                </button>
              </div>
            </form>
            {showDatePicker && (
              <div className="absolute top-[-1%] left-0 w-full h-full flex items-center justify-center ">
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-300 max-w-md w-full">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                    Select Date and Time
                  </h3>
                  <DatePicker
                    className="cursor-pointer w-full border border-gray-300 rounded px-4 py-2"
                    selected={plan.scheduleTime}
                    onChange={(date) => {
                      setDeleteDate(date); 
                      setPlan({ ...plan, scheduleTime: date }); 
                    }}

                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="Pp"
                  />
                  <div className="flex justify-start mt-6 gap-x-4">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded shadow"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Selected Date and Time:', plan.scheduleTime);

                        setShowDatePicker(false);
                      }}
                    >
                      Set
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded shadow"
                      onClick={() => {
                        setPlan({ ...plan, scheduleTime: new Date() }); 
                        setShowDatePicker(false);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4">
              {plan.scheduleTime && (
                <p className="mt-2 text-gray-700 pb-5">
                  <strong>Selected Date and Time:</strong>{' '}
                  {new Date(plan.scheduleTime).toLocaleString()}
                </p>
              )}
              {plans && Array.isArray(plans) && plans.length > 0 ? (
                <ul className="text-left">
                  {plans.map((plan, index) => {
                    if (!plan || !plan.name || plan.pricePerMinute === undefined || !plan.range) {
                      console.error(`Invalid plan at index ${index}`, plan);
                      return null; 
                    }
                    return (
                      <li key={plan._id || index} className="mb-2 p-2 border-b border-gray-200 flex justify-between items-start">
                        <div>
                          <p>
                            <strong>Plan:</strong> {plan.name || 'Unnamed Plan'}
                          </p>
                          <p>
                            <strong>Rate:</strong> ₹{plan.pricePerMinute}
                          </p>
                          <p>
                            <strong>Minutes:</strong> {plan.range.start} - {plan.range.end || 'or more'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            className="bg-gray-300 text-black px-2 py-1 text-sm rounded hover:bg-gray-400"
                            onClick={() => {
                              setPlan({
                                _id: plan._id,
                                name: plan.name,
                                pricePerMinute: plan.pricePerMinute,
                                rangeStart: plan.range.start,
                                rangeEnd: plan.range.end,
                                serviceId: plan.service,
                                isLast: plan.isLast,
                              });
                              setShowAddPlanInputs(true);
                            }}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </button>
                          <button
                            className="bg-gray-300 text-black px-2 py-1 text-sm rounded hover:bg-gray-400"
                            onClick={() => {
                              if (!deleteDate || isNaN(new Date(deleteDate).getTime())) {
                                alert('Please select a valid date and time before deleting.');
                                return;
                              }
                              handlePlanDelete(plan._id, deleteDate);
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  {showAddPlanInputs && (
                    <li className="mb-2 p-2 border-b border-gray-200">
                      <div className="flex justify-end mb-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={plan.isLast}
                            onChange={(e) => setPlan({ ...plan, isLast: e.target.checked })}
                          />
                          Final
                        </label>
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-1">Plan Name: </label>
                        <input
                          type="text"
                          value={plan.name || ''}
                          onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                          className="w-full p-2 border rounded"
                          placeholder="Enter Plan Name"
                          required
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-1">Rate (₹): </label>
                        <input
                          type="number"
                          step="0.01"
                          value={plan.pricePerMinute || ''}
                          onChange={(e) => setPlan({ ...plan, pricePerMinute: e.target.value })}
                          className="w-full p-2 border rounded"
                          placeholder="Enter Rate"
                          required
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-1">Minutes Range: </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={plan.rangeStart || ''}
                            onChange={(e) => setPlan({ ...plan, rangeStart: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
                            placeholder="Start"
                          />
                          {!plan.isLast && (
                            <input
                              type="number"
                              value={plan.rangeEnd || ''}
                              onChange={(e) => setPlan({ ...plan, rangeEnd: e.target.value })}
                              className="w-full p-2 border rounded"
                              placeholder="End"
                              required
                            />
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <button
                          className="bg-green-500 text-white px-4 py-2 rounded"
                          onClick={handlePlanSubmit}
                        >
                          Save Plan
                        </button>
                      </div>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-gray-500">No plans available for the selected service.</p>
              )}

            </div>

            <div className="mt-6 text-center">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                onClick={() => setShowAddPlanInputs(true)}
              >
                Add Plan
              </button>
              {planMessage && <p className="mt-4 text-green-500">{planMessage}</p>}
            </div>
          </div>
        )}

        {tab === 'addService' && (
          <div className="text-left">
            <form onSubmit={handleAddService}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">New Service Name</label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter Service Name"
                  required
                />
              </div>
              <div className="text-center">
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                  Add Service
                </button>
              </div>
              {newServiceMessage && <p className="mt-4 text-green-500">{newServiceMessage}</p>}
            </form>
          </div>
        )}

      </div>
      <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
    </div>
  );
};

export default ForAdmin;
