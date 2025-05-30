import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { db, auth } from '../firebase/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

dayjs.extend(isoWeek);

export default function AdminSheet() {
  const months = [...Array(12)].map((_, i) => {
    const month = i + 1;
    return {
      label: dayjs().month(i).format('MMMM YYYY'),
      value: `2025-${String(month).padStart(2, '0')}`,
    };
  });

  const defaultMonth = dayjs().format('YYYY-MM');
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchAllUserSchedules = async (startOfMonth, endOfMonth) => {
    console.log('🚀 [fetchAllUserSchedules] Starting');
  
    const allUserData = [];
    const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
    console.log('📁 schedules snapshot size:', schedulesSnapshot.size);
  
    for (const userDoc of schedulesSnapshot.docs) {
      const userId = userDoc.id;
      console.log('👤 Found user:', userId);
  
      const weeksRef = collection(db, 'schedules', userId, 'weeks');
      const weeksSnapshot = await getDocs(weeksRef);
  
      for (const weekDoc of weeksSnapshot.docs) {
        const weekId = weekDoc.id;
        const daysRef = collection(db, 'schedules', userId, 'weeks', weekId, 'days');
        const daysSnapshot = await getDocs(daysRef);
  
        daysSnapshot.forEach(doc => {
          const data = doc.data();
          const date = dayjs(data.date);
  
          if (date.isValid() && date.isSameOrAfter(startOfMonth) && date.isSameOrBefore(endOfMonth)) {
            allUserData.push({ ...data, userId });
          }
        });
      }
    }
  
    console.log('📊 All fetched user records:', allUserData.length);
    return allUserData;
  };
  

  const fetchOwnSchedules = async (startOfMonth, endOfMonth, userId) => {
    const allRecords = [];

    for (let i = 0; i < endOfMonth.date(); i++) {
      const currentDate = startOfMonth.add(i, 'day');
      const weekId = currentDate.isoWeekday(1).format('YYYY-MM-DD');
      const dayId = currentDate.format('YYYY-MM-DD');

      const ref = collection(db, 'schedules', userId, 'weeks', weekId, 'days');
      const snapshot = await getDocs(ref);

      snapshot.forEach(doc => {
        const data = doc.data();
        if (doc.id === dayId) {
          allRecords.push({ ...data, userId });
        }
      });
    }

    return allRecords;
  };

  const fetchMonthRecords = async (user) => {
    console.log('📦 [fetchMonthRecords] Starting for user:', user.email);

    setLoading(true);
    setUnauthorized(false);

    const isAdminUser = user.email === 'adityaj7014@gmail.com';
    setIsAdmin(isAdminUser);

    const startOfMonth = dayjs(`${selectedMonth}-01`);
    const endOfMonth = startOfMonth.endOf('month');

    try {
      const fetchedRecords = isAdminUser
        ? await fetchAllUserSchedules(startOfMonth, endOfMonth)
        : await fetchOwnSchedules(startOfMonth, endOfMonth, user.uid);

      console.log('✅ [fetchMonthRecords] Got records:', fetchedRecords);
      setRecords(fetchedRecords);
    } catch (err) {
      console.error('🔥 Error in fetchMonthRecords:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('👤 Firebase Auth state changed. User:', user);

      if (user) {
        const userRef = doc(db, 'schedules', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.log(`🆕 Creating schedules/${user.uid}`);
          await setDoc(userRef, { createdAt: new Date().toISOString() });
        }

        fetchMonthRecords(user);
      } else {
        setUnauthorized(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [selectedMonth]);

  const formatDuration = (start, end) => {
    if (!start || !end) return '0:00';
    const diff = dayjs(end).diff(dayjs(start), 'minute');
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  const groupedRecords = {
    firstHalf: [],
    secondHalf: [],
  };

  records.forEach((entry) => {
    const date = dayjs(entry.date);
    const obj = {
      userId: entry.userId || '',
      date: date.format('D-MMM'),
      day: date.format('dddd'),
      manager: entry.manager || '',
      notes: entry.notes || '',
      scheduleStart: entry.startTime || '',
      scheduleEnd: entry.endTime || '',
      actualStart: '',
      actualEnd: '',
      total: '0:00',
      totalMinutes: 0,
    };

    let totalMinutes = 0;
    let firstIn = '';
    let lastOut = '';

    if (Array.isArray(entry.sessions) && entry.sessions.length > 0) {
      entry.sessions.forEach((s) => {
        if (s.in && s.out) {
          const sessionStart = dayjs(`${entry.date} ${s.in}`);
          let sessionEnd = dayjs(`${entry.date} ${s.out}`);
          if (sessionEnd.isBefore(sessionStart)) {
            sessionEnd = sessionEnd.add(1, 'day');
          }

          totalMinutes += sessionEnd.diff(sessionStart, 'minute');

          if (!firstIn || sessionStart.isBefore(dayjs(`${entry.date} ${firstIn}`))) {
            firstIn = s.in;
          }
          if (!lastOut || sessionEnd.isAfter(dayjs(`${entry.date} ${lastOut}`))) {
            lastOut = s.out;
          }
        }
      });

      obj.actualStart = firstIn || 'N/A';
      obj.actualEnd = lastOut || 'N/A';
      obj.total = totalMinutes > 0
        ? formatDuration(dayjs().startOf('day'), dayjs().startOf('day').add(totalMinutes, 'minute'))
        : '0:00';
      obj.totalMinutes = totalMinutes;
    } else {
      obj.actualStart = 'N/A';
      obj.actualEnd = 'N/A';
    }

    if (entry.status === 'on_call') {
      obj.scheduleStart = 'ON CALL';
      obj.scheduleEnd = 'ON CALL';
    } else if (entry.status === 'not_available') {
      obj.scheduleStart = 'NOT AVAILABLE';
      obj.scheduleEnd = 'NOT AVAILABLE';
    }

    (date.date() <= 15 ? groupedRecords.firstHalf : groupedRecords.secondHalf).push(obj);
  });

  const renderTable = (data, label) => {
    let totalScheduledMinutes = 0;
    let totalWorkedMinutes = 0;

    data.forEach((rec) => {
      if (
        rec.scheduleStart &&
        rec.scheduleEnd &&
        rec.scheduleStart !== 'ON CALL' &&
        rec.scheduleStart !== 'NOT AVAILABLE'
      ) {
        const start = dayjs(`2025-01-01 ${rec.scheduleStart}`);
        const end = dayjs(`2025-01-01 ${rec.scheduleEnd}`);
        totalScheduledMinutes += end.diff(start, 'minute');
      }

      if (rec.actualStart && rec.actualEnd) {
        totalWorkedMinutes += rec.totalMinutes || 0;
      }
    });

    const formatMinutes = (mins) => {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return `${hrs}:${rem.toString().padStart(2, '0')}`;
    };

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{label}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 text-sm text-center">
            <thead className="bg-gray-100 font-medium">
              <tr>
                <th className="border p-2">User ID</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Day</th>
                <th className="border p-2">Start</th>
                <th className="border p-2">End</th>
                <th className="border p-2">Punch In</th>
                <th className="border p-2">Punch Out</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Notes</th>
                <th className="border p-2">Manager</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rec, idx) => (
                <tr key={idx}>
                  <td className="border p-1">{rec.userId}</td>
                  <td className="border p-1">{rec.date}</td>
                  <td className="border p-1">{rec.day}</td>
                  <td className="border p-1">{rec.scheduleStart}</td>
                  <td className="border p-1">{rec.scheduleEnd}</td>
                  <td className="border p-1">{rec.actualStart}</td>
                  <td className="border p-1">{rec.actualEnd}</td>
                  <td className="border p-1 font-semibold">{rec.total}</td>
                  <td className="border p-1">{rec.notes}</td>
                  <td className="border p-1">{rec.manager}</td>
                </tr>
              ))}

              <tr className="bg-gray-50 font-semibold text-gray-700">
                <td colSpan={7} className="border p-2 text-right">Scheduled Total:</td>
                <td className="border p-2">{formatMinutes(totalScheduledMinutes)}</td>
                <td colSpan={2} />
              </tr>
              <tr className="bg-gray-50 font-semibold text-green-700">
                <td colSpan={7} className="border p-2 text-right">Completed Total:</td>
                <td className="border p-2">{formatMinutes(totalWorkedMinutes)}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-teal-700">Timesheets</h1>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border px-3 py-2 rounded text-sm w-full sm:w-auto"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : unauthorized ? (
        <p className="text-red-600 text-lg">🚫 Unauthorized. You do not have access.</p>
      ) : (
        <>
          {renderTable(groupedRecords.firstHalf, '1 – 15')}
          {renderTable(groupedRecords.secondHalf, '16 – End')}
        </>
      )}
    </div>
  );
}
