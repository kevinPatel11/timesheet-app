import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import dayjs from 'dayjs';
import { Clock, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Dashboard() {
  const [notes, setNotes] = useState('');
  const [manager, setManager] = useState('');
  const [customTime, setCustomTime] = useState(dayjs().format('HH:mm'));
  const [punchType, setPunchType] = useState('in');
  const [loading, setLoading] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState(null);

  const user = auth.currentUser;
useEffect(() => {
  if (!scheduleInfo) return;

  if (punchType === 'in') {
    setCustomTime(scheduleInfo.inTime || dayjs().format('HH:mm'));
  } else if (punchType === 'out') {
    setCustomTime(scheduleInfo.outTime || dayjs().format('HH:mm'));
  }
}, [punchType, scheduleInfo]);

const fetchTodaySchedule = async () => {
  if (!user) return;

  const today = dayjs();
  const weekId = today.startOf('week').add(1, 'day').format('YYYY-MM-DD');
  const dateId = today.format('YYYY-MM-DD');
  const dayRef = doc(db, 'schedules', user.uid, 'weeks', weekId, 'days', dateId);
  const snap = await getDoc(dayRef);

  if (snap.exists()) {
    const data = snap.data();
    setScheduleInfo(data);

    const hasIn = data?.inTime;
    const hasOut = data?.outTime;

  if (hasIn && !hasOut) {
  setPunchType('out');
  setCustomTime(data.outTime || dayjs().format('HH:mm'));
} else if (!hasIn) {
  setPunchType('in');
  setCustomTime(dayjs().format('HH:mm'));
} else {
  setPunchType('out');
  setCustomTime(data.outTime);
}


    setManager(data.manager || '');
    setNotes(data.notes || '');
  } else {
    // No schedule yet
    setScheduleInfo(null);
    setPunchType('in');
    setCustomTime(dayjs().format('HH:mm'));
  }
};


  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  const handlePunch = async () => {
    setLoading(true);
    toast.dismiss();

    if (!user) {
      toast.error('User not authenticated');
      setLoading(false);
      return;
    }

    const now = dayjs();
    const [hour, minute] = customTime.split(':');
    const punchTime = now.set('hour', parseInt(hour)).set('minute', parseInt(minute)).set('second', 0);
    const dateId = now.format('YYYY-MM-DD');
    const weekId = now.startOf('week').add(1, 'day').format('YYYY-MM-DD');
    const dayRef = doc(db, 'schedules', user.uid, 'weeks', weekId, 'days', dateId);

    try {
      const snap = await getDoc(dayRef);
      const existing = snap.exists() ? snap.data() : {};

      const scheduledStart = existing?.startTime;
      const scheduledEnd = existing?.endTime;

      const updated = {
        ...existing,
        [`${punchType}Time`]: punchTime.format('HH:mm'),
        notes,
        manager: existing?.manager || manager,
      };

      if (punchType === 'in' && scheduledStart) {
        const sched = dayjs(`${dateId}T${scheduledStart}`);
        if (punchTime.isBefore(sched)) {
          toast.success('✅ Well done! You came early.');
        } 
      }

      if (punchType === 'out' && scheduledEnd) {
        const sched = dayjs(`${dateId}T${scheduledEnd}`);
        if (punchTime.isBefore(sched)) {
          toast('⏰ Early punch out. ');
        } 
      }

      await setDoc(dayRef, updated, { merge: true });

      setNotes('');
      setLoading(false);
      fetchTodaySchedule(); // Refresh
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to punch. Try again.');
      setLoading(false);
    }
  };

  return (
<div className="p-6 bg-[#f1fafa]">
  <Toaster position="top-center" />

  <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
    {/* Header */}
    <div className="text-center">
      <div className="flex justify-center text-teal-700 mb-2">
        <Clock size={28} />
      </div>
      <h2 className="text-xl font-semibold text-teal-700">Time Clock</h2>
      <p className="text-gray-600 mt-1 text-sm">
        {dayjs().format('dddd, MMMM D, YYYY')}
      </p>
    </div>

    {/* Schedule Info */}
    {scheduleInfo && (
      <div className="mt-4 text-sm bg-gray-50 border border-gray-200 p-3 rounded-md">
        <div className="flex justify-between text-gray-700">
          <span className="font-medium">Scheduled</span>
          <span>
            {scheduleInfo.startTime
              ? dayjs(`${dayjs().format('YYYY-MM-DD')}T${scheduleInfo.startTime}`).format('hh:mm A')
              : '--:--'}{" "}
            –{" "}
            {scheduleInfo.endTime
              ? dayjs(`${dayjs().format('YYYY-MM-DD')}T${scheduleInfo.endTime}`).format('hh:mm A')
              : '--:--'}
          </span>
        </div>

        {scheduleInfo.inTime && (
          <div className="flex justify-between mt-2 text-green-600">
            <span>🕒 Punched In</span>
            <span>
              {dayjs(`${dayjs().format('YYYY-MM-DD')}T${scheduleInfo.inTime}`).format('hh:mm A')}
            </span>
          </div>
        )}

        {scheduleInfo.outTime && (
          <div className="flex justify-between mt-1 text-orange-600">
            <span>🕓 Punched Out</span>
            <span>
              {dayjs(`${dayjs().format('YYYY-MM-DD')}T${scheduleInfo.outTime}`).format('hh:mm A')}
            </span>
          </div>
        )}
      </div>
    )}




        {/* Punch Type Buttons */}
        <div className="mt-4 flex gap-4 justify-center">
          <button
            className={`px-4 py-1 rounded-md border ${punchType === 'in' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setPunchType('in')}
          >
            Punch In
          </button>
          <button
            className={`px-4 py-1 rounded-md border ${punchType === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setPunchType('out')}
          >
            Punch Out
          </button>
        </div>

        {/* Custom Time */}
        <div className="mt-4 text-left">
          <label className="text-sm text-gray-600 block mb-1">Time</label>
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-[#f1fafa]"
          />
        </div>



        {/* Notes */}
        <div className="mt-4 text-left">
          <label className="text-sm text-gray-600 mb-1 block">Shift Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-[#f1fafa]"
            placeholder=""
          />
        </div>

        {/* Manager */}
        <div className="mt-4 text-left">
          <label className="text-sm text-gray-600 mb-1 block">Manager on Duty (Optional)</label>
          <input
            type="text"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-[#f1fafa]"
          />
        </div>

        {/* Punch Button */}
        <button
          onClick={handlePunch}
          disabled={loading}
          className={`mt-6 px-6 py-2 rounded-md font-semibold flex items-center justify-center mx-auto gap-1 ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <Clock size={16} /> {loading ? 'Processing...' : `Punch ${punchType === 'in' ? 'In' : 'Out'}`}
        </button>
      </div>

      <div className="max-w-xl mx-auto mt-6 p-4 bg-blue-100 border border-blue-300 rounded-md text-sm flex items-start gap-2 text-blue-800">
        <Info size={20} className="mt-1" />
        <div>
          <strong className="block mb-1">Punch Guidelines</strong>
          Scheduled times are shown above. Punch early or late with optional reasons. Manager name can be updated.
        </div>
      </div>
    </div>
  );
}
