import React, { useState } from 'react';
import dayjs from 'dayjs';
import { db, auth } from '../firebase/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';

const shiftTypes = ['Working', 'On Call', 'Not Available'];

export default function AddScheduleModal({ weekStart, onClose, existingEntry = null, editDate = null }) {
  const initialSchedule = existingEntry
    ? [{
      day: editDate,
      type: existingEntry.status === 'scheduled'
        ? 'Working'
        : existingEntry.status === 'on_call'
          ? 'On Call'
          : 'Not Available',
      start: existingEntry.startTime || '',
      end: existingEntry.endTime || '',
      notes: existingEntry.notes || '',
      manager: existingEntry.manager || '',
      punchIn: existingEntry.inTime || '',
      punchOut: existingEntry.outTime || '',
    }]
    : [...Array(7)].map((_, idx) => ({
      day: weekStart.add(idx, 'day'),
      type: 'Working',
      start: '15:00',
      end: '23:00',
      notes: '',
      manager: ''
    }));

  const [schedule, setSchedule] = useState(initialSchedule);

  const handleChange = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    const weekId = weekStart.format('YYYY-MM-DD');

    if (!user) {
      alert("Not authenticated");
      return;
    }

    try {
      for (const entry of schedule) {
        const dayId = entry.day.format('YYYY-MM-DD');
        const dayCollectionRef = collection(
          db,
          'schedules',
          user.uid,
          'weeks',
          weekId,
          'days'
        );
        const dayDocRef = doc(dayCollectionRef, dayId);

        const entryData = {
          date: dayId,
          status:
            entry.type === 'Working'
              ? 'scheduled'
              : entry.type === 'On Call'
                ? 'on_call'
                : 'not_available',
          ...(entry.type === 'Working' && {
            startTime: entry.start,
            endTime: entry.end,
            manager: entry.manager || '',
            notes: entry.notes || '',

          }),
          ...(entry.type !== 'Working' && { notes: entry.notes || '' }),
          ...(entry.punchIn && { inTime: entry.punchIn }),
          ...(entry.punchOut && { outTime: entry.punchOut }),
          userId: user.uid,
        };


        await setDoc(dayDocRef, entryData);
      }

      onClose();
    } catch (error) {
      console.error('🔥 Error saving schedule:', error);
      alert('Something went wrong while saving your schedule. Check console.');
    }
  };

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!user || !editDate) return;

    try {
      const weekId = weekStart.format('YYYY-MM-DD');
      const dayId = editDate.format('YYYY-MM-DD');
      const dayDocRef = doc(db, 'schedules', user.uid, 'weeks', weekId, 'days', dayId);

      await deleteDoc(dayDocRef);
      alert('Schedule deleted!');
      onClose();
    } catch (error) {
      console.error('🔥 Error deleting schedule:', error);
      alert('Something went wrong while deleting your schedule.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-teal-700">
          {existingEntry ? 'Edit Schedule' : 'Add Weekly Schedule'}
        </h2>

        <div className="space-y-4">
          {schedule.map((entry, index) => (
            <div key={entry.day.format('YYYY-MM-DD')} className="border p-4 rounded">
              <h3 className="font-semibold mb-2 text-gray-800">
                {entry.day.format('dddd')} ({entry.day.format('MMM D')})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">Shift Type</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={entry.type}
                    onChange={(e) => handleChange(index, 'type', e.target.value)}
                  >
                    {shiftTypes.map(type => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {entry.type === 'Working' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600">Shift Time</label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={
                          ['09:00-17:00', '12:00-20:00', '15:00-23:00', '15:30-23:30']
                            .includes(`${entry.start}-${entry.end}`)
                            ? `${entry.start}-${entry.end}`
                            : 'custom'
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'custom') {
                            handleChange(index, 'start', '');
                            handleChange(index, 'end', '');
                          } else {
                            const [start, end] = value.split('-');
                            handleChange(index, 'start', start);
                            handleChange(index, 'end', end);
                          }
                        }}
                      >
                        <option value="09:00-17:00">9:00 AM - 5:00 PM</option>
                        <option value="12:00-20:00">12:00 PM - 8:00 PM</option>
                        <option value="15:00-23:00">3:00 PM - 11:00 PM</option>
                        <option value="15:30-23:30">3:30 PM - 11:30 PM</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    {/* Custom Inputs */}
                    {(['09:00-17:00', '12:00-20:00', '15:00-23:00', '15:30-23:30'].includes(`${entry.start}-${entry.end}`) === false) && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-600">Start Time</label>
                          <input
                            type="time"
                            className="w-full border rounded px-2 py-1"
                            value={entry.start}
                            onChange={(e) => handleChange(index, 'start', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600">End Time</label>
                          <input
                            type="time"
                            className="w-full border rounded px-2 py-1"
                            value={entry.end}
                            onChange={(e) => handleChange(index, 'end', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                  </>
                )}
              </div>

              {editDate &&  (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm text-gray-600">Punch In Time</label>
                    <input
                      type="time"
                      className="w-full border rounded px-2 py-1"
                      value={entry.punchIn}
                      onChange={(e) => handleChange(index, 'punchIn', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Punch Out Time</label>
                    <input
                      type="time"
                      className="w-full border rounded px-2 py-1"
                      value={entry.punchOut}
                      onChange={(e) => handleChange(index, 'punchOut', e.target.value)}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm text-gray-600">
                      Notes
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      value={entry.notes}
                      onChange={(e) => handleChange(index, 'notes', e.target.value)}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm text-gray-600">
                      Manager
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      value={entry.manager}
                      onChange={(e) => handleChange(index, 'manager', e.target.value)}
                    />
                  </div>
                </div>
              )}


            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
            Save Schedule
          </button>
          {/* {editDate && existingEntry && (
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Delete
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
}
