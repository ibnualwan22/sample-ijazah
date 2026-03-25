import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, isWithinInterval, addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    // Default to current month if not provided
    const targetDate = (monthStr && yearStr) 
      ? new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1) 
      : new Date();

    const startWindow = startOfMonth(targetDate);
    const endWindow = endOfMonth(targetDate);

    // Fetch singular agendas within the month
    const singularAgendas = await prisma.agenda.findMany({
      where: {
        isBerulang: false,
        waktuMulai: {
          gte: startWindow,
          lte: endWindow,
        }
      }
    });

    // Fetch recurrent agendas that are relevant for this month
    const recurrentAgendas = await prisma.agenda.findMany({
      where: {
        isBerulang: true,
        waktuMulai: {
          lte: endWindow,
        },
        OR: [
          { batasPerulangan: null },
          { batasPerulangan: { gte: startWindow } }
        ]
      }
    });

    const expandedAgendas: any[] = [];

    // Map singular agendas
    singularAgendas.forEach(a => expandedAgendas.push({ ...a, instanceDate: a.waktuMulai }));

    // Expand recurrent agendas
    recurrentAgendas.forEach(agenda => {
      let currentInstance = new Date(agenda.waktuMulai);
      
      // Calculate duration of the event to keep start & end times accurate for each instance
      const durationMs = new Date(agenda.waktuSelesai).getTime() - new Date(agenda.waktuMulai).getTime();

      // Fast-forward cursor to the start of the window if it started long ago
      if (agenda.tipePerulangan === 'HARIAN') {
        while (isBefore(currentInstance, startWindow)) {
          currentInstance = addDays(currentInstance, 1);
        }
      } else if (agenda.tipePerulangan === 'MINGGUAN') {
        while (isBefore(currentInstance, startWindow)) {
          currentInstance = addWeeks(currentInstance, 1);
        }
      } else if (agenda.tipePerulangan === 'BULANAN') {
        while (isBefore(currentInstance, startWindow)) {
          currentInstance = addMonths(currentInstance, 1);
        }
      }

      // Generate instances within the window
      while (
        !isAfter(currentInstance, endWindow) && 
        (!agenda.batasPerulangan || !isAfter(currentInstance, new Date(agenda.batasPerulangan)))
      ) {
        if (!isBefore(currentInstance, startWindow)) {
          expandedAgendas.push({
            ...agenda,
            instanceDate: currentInstance,
            instanceWaktuSelesai: new Date(currentInstance.getTime() + durationMs)
          });
        }

        if (agenda.tipePerulangan === 'HARIAN') {
          currentInstance = addDays(currentInstance, 1);
        } else if (agenda.tipePerulangan === 'MINGGUAN') {
          currentInstance = addWeeks(currentInstance, 1);
        } else if (agenda.tipePerulangan === 'BULANAN') {
          currentInstance = addMonths(currentInstance, 1);
        } else {
          break; // Safety fallback
        }
      }
    });

    // Sort all by derived instanceDate
    expandedAgendas.sort((a, b) => new Date(a.instanceDate).getTime() - new Date(b.instanceDate).getTime());

    return NextResponse.json(
      { success: true, month: targetDate.getMonth() + 1, year: targetDate.getFullYear(), data: expandedAgendas },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal memuat agenda' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
