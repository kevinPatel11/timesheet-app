import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import AddScheduleModal from '../components/AddScheduleModal';
import { Calendar } from 'lucide-react';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Schedule() {
    const [weekStart, setWeekStart] = useState(dayjs().startOf('week').add(1, 'day')); // Monday
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scheduleData, setScheduleData] = useState({});
    const [loading, setLoading] = useState(true);

    const [editEntry, setEditEntry] = useState(null);
    const [editDate, setEditDate] = useState(null);

    const weekDays = [...Array(7)].map((_, idx) => weekStart.add(idx, 'day'));

    const handleNextWeek = () => setWeekStart(weekStart.add(7, 'day'));
    const handlePrevWeek = () => setWeekStart(weekStart.subtract(7, 'day'));

    const fetchSchedule = async () => {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        try {
            const weekId = weekStart.format('YYYY-MM-DD');
            const daysRef = collection(db, 'schedules', user.uid, 'weeks', weekId, 'days');
            const snapshot = await getDocs(daysRef);

            const data = {};
            snapshot.forEach(doc => {
                const docData = doc.data();
                data[doc.id] = docData;
            });

            setScheduleData(data);
        } catch (err) {
            console.error('Error fetching schedule:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [weekStart, isModalOpen]);

    const openEditModal = (entry, date) => {
        setEditEntry(entry);
        setEditDate(date);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditEntry(null);
        setEditDate(null);
    };


    let totalScheduledMinutes = 0;
    let totalWorkedMinutes = 0;
  
    Object.values(scheduleData).forEach(entry => {
      if (entry.status === 'scheduled' && entry.startTime && entry.endTime) {
        const start = dayjs(`${entry.date} ${entry.startTime}`, 'YYYY-MM-DD HH:mm');
        let end = dayjs(`${entry.date} ${entry.endTime}`, 'YYYY-MM-DD HH:mm');
        if (end.isBefore(start)) end = end.add(1, 'day');
        totalScheduledMinutes += end.diff(start, 'minute');
      }
  
      if (entry.sessions && Array.isArray(entry.sessions)) {
        entry.sessions.forEach(session => {
          if (!session.in || !session.out || session.in === '00:00' && session.out === '00:00') return;
          const inTime = dayjs(`${entry.date} ${session.in}`, 'YYYY-MM-DD HH:mm');
          let outTime = dayjs(`${entry.date} ${session.out}`, 'YYYY-MM-DD HH:mm');
          if (outTime.isBefore(inTime)) outTime = outTime.add(1, 'day');
          totalWorkedMinutes += outTime.diff(inTime, 'minute');
        });
      } else if (entry.inTime && entry.outTime && entry.inTime !== '00:00' && entry.outTime !== '00:00') {
        const inTime = dayjs(`${entry.date} ${entry.inTime}`, 'YYYY-MM-DD HH:mm');
        let outTime = dayjs(`${entry.date} ${entry.outTime}`, 'YYYY-MM-DD HH:mm');
        if (outTime.isBefore(inTime)) outTime = outTime.add(1, 'day');
        totalWorkedMinutes += outTime.diff(inTime, 'minute');
      }
    });
  
    const totalScheduledHours = (totalScheduledMinutes / 60).toFixed(2);
    const totalWorkedHours = (totalWorkedMinutes / 60).toFixed(2);

    return (
        <div className="px-4">
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                {/* Title and Icon */}
                <div className="flex items-center gap-2 text-teal-700">
                    <Calendar size={24} />
                    <h2 className="text-xl sm:text-2xl font-semibold">Weekly Schedule</h2>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={handlePrevWeek}
                        className="px-3 py-2 border rounded hover:bg-gray-100 text-sm sm:text-base"
                    >
                        Previous Week
                    </button>
                    <button
                        onClick={handleNextWeek}
                        className="px-3 py-2 border rounded hover:bg-gray-100 text-sm sm:text-base"
                    >
                        Next Week
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-sm sm:text-base"
                    >
                        + Add Entry
                    </button>
                </div>
            </div>

            {/* Week Range Display */}
            <div className="text-center mb-6">
                <h3 className="text-sm text-gray-500">
                    Week of <span className="font-medium text-gray-700">{weekStart.format('MMMM D, YYYY')}</span> –{' '}
                    <span className="font-medium text-gray-700">{weekStart.add(6, 'day').format('MMMM D, YYYY')}</span>
                </h3>
            </div>




            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {weekDays.map(day => {
                    const dayId = day.format('YYYY-MM-DD');
                    const entry = scheduleData[dayId];

                    return (
                        <div
  key={dayId}
  className={`bg-white shadow rounded p-4 hover:ring-2 hover:ring-teal-300 cursor-pointer transition ${
    dayjs().isSame(day, 'day') ? 'ring-2 ring-blue-400' : ''
  }`}
  onClick={() => entry && openEditModal(entry, day)}
>
                            <h3 className="font-semibold text-gray-800 border-b pb-1 mb-2">
                                {day.format('dddd')} <span className="text-sm text-gray-500">({day.format('MMMM D')})</span>
                            </h3>

                            {loading ? (
                                <p className="text-sm text-gray-400">Loading...</p>
                            ) : entry ? (
                                <>
                                {entry.status === 'on_call' && (
                                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm font-medium">
                                    On Call
                                    {entry.sessions?.length > 0 && entry.sessions.map((session, i) => {
                                      const inTime = dayjs(`${entry.date} ${session.in}`, 'YYYY-MM-DD HH:mm');
                                      let outTime = dayjs(`${entry.date} ${session.out}`, 'YYYY-MM-DD HH:mm');
                                      if (outTime.isBefore(inTime)) outTime = outTime.add(1, 'day');
                                      const diff = outTime.diff(inTime, 'minute');
                                      const hrs = Math.floor(diff / 60);
                                      const mins = diff % 60;
                                      return (
                                        <div key={i} className="text-sm text-green-700">
                                          🕒 {inTime.format('h:mm A')} – {outTime.format('h:mm A')} ({hrs}h {mins}m)
                                        </div>
                                      );
                                    })}
                                     {entry.manager && <p className="text-xs text-teal-700">Manager: {entry.manager}</p>}
                                     {entry.notes && <p className="text-xs text-teal-700">Notes: {entry.notes}</p>}
                                  </div>
                                )}
              

                                    {entry.status === 'not_available' && (
                                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm font-medium">
                                            Not Available
                                        </div>
                                    )}

                                        {entry.status === 'scheduled'  && (
                                            <div className="bg-teal-50 border border-teal-200 text-teal-800 px-3 py-2 rounded text-sm space-y-1">
                                                <p className="font-medium">
                                                    🗓 Scheduled: {dayjs(`${entry.date} ${entry.startTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')} – {dayjs(`${entry.date} ${entry.endTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A')}
                                                </p>
                                                {entry.sessions?.length > 0 && entry.sessions.map((session, i) => {
                                                    const inTime = dayjs(`${entry.date} ${session.in}`, 'YYYY-MM-DD HH:mm');
                                                    let outTime = dayjs(`${entry.date} ${session.out}`, 'YYYY-MM-DD HH:mm');
                                                    if (outTime.isBefore(inTime)) outTime = outTime.add(1, 'day');
                                                    const diff = outTime.diff(inTime, 'minute');
                                                    const hrs = Math.floor(diff / 60);
                                                    const mins = diff % 60;
                                                    return (
                                                        <div key={i} className="text-sm text-green-700">
                                                            🕒 {inTime.format('h:mm A')} – {outTime.format('h:mm A')} ({hrs}h {mins}m)
                                                        </div>
                                                    );
                                                })}

                                                {!entry.sessions && entry.inTime && entry.outTime && (
                                                    <div className="text-sm text-green-700">
                                                        🕒 {dayjs(`${entry.date} ${entry.inTime}`).format('h:mm A')} – {dayjs(`${entry.date} ${entry.outTime}`).format('h:mm A')}
                                                    </div>
                                                )}

                                                {entry.manager && <p className="text-xs text-teal-700">Manager: {entry.manager}</p>}
                                                {entry.notes && <p className="text-xs text-teal-700">Notes: {entry.notes}</p>}
                                            </div>
                                        )}

                                    {/* {entry.notes  && (
                                        <p className="text-xs text-gray-500 mt-1">Notes: {entry.notes}</p>
                                    )}
                                     {entry.manager  && (
                                        <p className="text-xs text-gray-500 mt-1">manager: {entry.manager}</p>
                                    )} */}
                                
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">No shifts scheduled.</p>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Totals Summary */}
            <div className="max-w-md mx-auto bg-white border border-gray-200 shadow-sm rounded-lg p-4 text-center mt-4">
                <h4 className="text-base font-semibold text-gray-800 mb-2">Weekly Summary</h4>
                <div className="flex items-center justify-around">
                    <div>
                        <p className="text-sm text-gray-600">Scheduled Hours</p>
                        <p className="text-xl font-bold text-teal-700">{totalScheduledHours} hrs</p>
                    </div>
                    <div className="border-l border-gray-300 h-10" />
                    <div>
                        <p className="text-sm text-gray-600">Worked Hours</p>
                        <p className="text-xl font-bold text-green-600">{totalWorkedHours} hrs</p>
                    </div>
                </div>
            </div>


            {isModalOpen && (
                <AddScheduleModal
                    weekStart={weekStart}
                    onClose={handleCloseModal}
                    existingEntry={editEntry}
                    editDate={editDate}
                />
            )}
        </div>
    );
}
