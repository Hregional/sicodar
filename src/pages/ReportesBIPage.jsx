// src/pages/ReportesBIPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Layout/Sidebar';
import { Header } from '../components/Layout/Header';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import api from '../services/api';
import { exportToExcel } from '../utils/excelExport';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Layers3, PieChart as PieChartIcon } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'especialidad', label: 'Consumo por especialidad' },
  { value: 'top10', label: 'Top 10 productos mas consumidos' },
];

const numberGT = new Intl.NumberFormat('es-GT', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currencyGT = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
});

const initialRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const normalize = (date) => date.toISOString().slice(0, 10);
  return { Inicio: normalize(start), Fin: normalize(end) };
};

export default function ReportesBIPage({ user }) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [range, setRange] = useState(initialRange);
  const [especialidadFiltro, setEspecialidadFiltro] = useState('');
  const [especialidadesCatalogo, setEspecialidadesCatalogo] = useState([]);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/especialidades/')
      .then(({ data }) =>
        setEspecialidadesCatalogo(
          (data || []).map((item) => item.nombre).filter(Boolean)
        )
      )
      .catch(() =>
        setEspecialidadesCatalogo([
          'CirugÃ­a',
          'Laboratorio',
          'Urgencias',
          'Medicina Interna',
          'PediatrÃ­a',
          'GinecologÃ­a',
          'Farmacia',
          'EstÃ©ril',
          'General',
        ])
      );
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/reportes/consumo-por-especialidad', {
        params: {
          fecha_Inicio: range.Inicio,
          fecha_Fin: range.Fin,
        },
      });
      setPayload(data);
    } catch (err) {
      console.error('Error al generar reporte BI:', err);
      setError(
        err.response?.data?.detail ||
          'No se pudo generar el reporte. Intentalo nuevamente.'
      );
      setPayload(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const especialidadesData = useMemo(() => {
    const fuente = payload?.especialidades || {};
    if (!especialidadFiltro) {
      return fuente;
    }
    if (fuente[especialidadFiltro]) {
      return { [especialidadFiltro]: fuente[especialidadFiltro] };
    }
    return {};
  }, [payload, especialidadFiltro]);

  const chartData = useMemo(
    () =>
      Object.entries(especialidadesData).map(([especialidad, data]) => ({
        especialidad,
        cantidad: data.total_cantidad || 0,
        costo: data.total_costo || 0,
      })),
    [especialidadesData]
  );

const top10 = useMemo(() => {
  return Object.entries(especialidadesData)
    .flatMap(([especialidad, data]) =>
      (data.insumos || []).map((item) => ({
        especialidad,
        insumo: item.insumo,
        cantidad: item.cantidad || 0,
        costo: item.costo || 0,
      }))
    )
    .sort((a, b) => b.cantidad - a.cantidad || b.costo - a.costo)
    .slice(0, 10);
}, [especialidadesData]);

  const resumenGeneral = useMemo(() => {
    const items = Object.entries(especialidadesData);
    let totalCantidad = 0;
    let totalCosto = 0;
    let top = null;

    items.forEach(([nombre, data]) => {
      const cantidad = data?.total_cantidad || 0;
      const costo = data?.total_costo || 0;
      totalCantidad += cantidad;
      totalCosto += costo;
      if (!top || costo > top.costo) {
        top = { nombre, costo };
      }
    });

    return {
      totalEspecialidades: items.length,
      totalCantidad,
      totalCosto,
      topEspecialidad: top,
    };
  }, [especialidadesData]);

  const exportEspecialidades = () => {
    const dataset = Object.entries(especialidadesData).flatMap(
      ([especialidad, data]) => {
        const base = {
          Especialidad: especialidad,
          'Total cantidad': data.total_cantidad || 0,
          'Total costo': data.total_costo || 0,
        };
        const filas = (data.insumos || []).map((insumo) => ({
          ...base,
          Insumo: insumo.insumo,
          Cantidad: insumo.cantidad || 0,
          Costo: insumo.costo || 0,
        }));
        return filas.length > 0 ? filas : [{ ...base, Insumo: '', Cantidad: 0, Costo: 0 }];
      }
    );
    exportToExcel(dataset, 'reporte_especialidades');
  };

  const renderEspecialidades = () => {
    if (chartData.length === 0) {
      return (
        <p className="py-10 text-center text-sm text-slate-500">
          No hay datos para el rango seleccionado.
        </p>
      );
    }

    return (
      <Card className="space-y-4 border border-slate-100 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Consumo por especialidad
          </h3>
          <Button
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
            onClick={exportEspecialidades}
          >
            <PieChartIcon size={14} />
            Exportar
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="4 3" stroke="#e2e8f0" />
            <XAxis dataKey="especialidad" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => currencyGT.format(value)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) =>
                name === 'costo'
                  ? [currencyGT.format(value), 'Costo (Q)']
                  : [numberGT.format(value), 'Cantidad']
              }
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="cantidad"
              name="Cantidad"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="costo"
              name="Costo (Q)"
              fill="#14b8a6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {Object.entries(especialidadesData).map(([nombre, data]) => (
          <Card key={nombre} className="border border-slate-100 p-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <h4 className="text-base font-semibold text-slate-900">
                {nombre}
              </h4>
              <div className="space-x-4">
                <span>
                  Cantidad:{' '}
                  <strong>{numberGT.format(data.total_cantidad || 0)}</strong>
                </span>
                <span>
                  Costo:{' '}
                  <strong>{currencyGT.format(data.total_costo || 0)}</strong>
                </span>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Insumo</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                    <th className="px-4 py-2 text-right">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(data.insumos || []).map((item) => (
                    <tr key={`${nombre}-${item.insumo}`}>
                      <td className="px-4 py-2">{item.insumo}</td>
                      <td className="px-4 py-2 text-right">
                        {numberGT.format(item.cantidad || 0)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {currencyGT.format(item.costo || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </Card>
    );
  };

  const renderTop10 = () => {
    if (top10.length === 0) {
      return (
        <p className="py-10 text-center text-sm text-slate-500">
          No hay consumos registrados en el periodo.
        </p>
      );
    }

    const dataset = top10.map((item, index) => ({
      Posicion: index + 1,
      Insumo: item.insumo,
      Especialidad: item.especialidad,
      Cantidad: item.cantidad || 0,
      Costo: item.costo || 0,
    }));

    return (
      <Card className="space-y-4 border border-slate-100 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Productos mas consumidos
          </h3>
          <Button
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
            onClick={() => exportToExcel(dataset, 'reporte_top10')}
          >
            <PieChartIcon size={14} />
            Exportar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Insumo</th>
                <th className="px-4 py-2 text-left">Especialidad</th>
                <th className="px-4 py-2 text-right">Cantidad</th>
                <th className="px-4 py-2 text-right">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {top10.map((item, index) => (
                <tr key={`${item.insumo}-${item.especialidad}`}>
                  <td className="px-4 py-2 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-2">{item.insumo}</td>
                  <td className="px-4 py-2">{item.especialidad}</td>
                  <td className="px-4 py-2 text-right">
                    {numberGT.format(item.cantidad || 0)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {currencyGT.format(item.costo || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <Card className="border border-white p-10">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100/70" />
        </Card>
      );
    }
    if (error) {
      return (
        <Card className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </Card>
      );
    }
    const summary = (
      <Card className="grid gap-4 border border-slate-100 p-6 md:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Especialidades analizadas
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {resumenGeneral.totalEspecialidades}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Consumo total (cantidad)
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {numberGT.format(resumenGeneral.totalCantidad)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Consumo total (costo)
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {currencyGT.format(resumenGeneral.totalCosto)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Especialidad con mayor costo
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {resumenGeneral.topEspecialidad?.nombre || 'Sin datos'}
          </p>
          <p className="text-xs text-slate-500">
            {currencyGT.format(resumenGeneral.topEspecialidad?.costo || 0)}
          </p>
        </div>
      </Card>
    );

    return reportType === 'top10' ? (
      <>
        {summary}
        {renderTop10()}
      </>
    ) : (
      <>
        {summary}
        {renderEspecialidades()}
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-sky-100 p-3 text-sky-600">
              <Layers3 size={26} />
            </div>
            <Header
              title="Inteligencia de Negocios"
              subtitle="Reportes de consumo por especialidad y anÃ¡lisis de inventario"
            />
          </div>

          <Card className="rounded-3xl border border-white bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur">
            <div className="grid gap-4 md:grid-cols-[220px_repeat(3,minmax(0,1fr))]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tipo de reporte
                </label>
                <select
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                >
                  {REPORT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Fecha Inicio
                </label>
                <Input
                  type="date"
                  value={range.Inicio}
                  onChange={(event) =>
                    setRange((prev) => ({ ...prev, Inicio: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Fecha Fin
                </label>
                <Input
                  type="date"
                  value={range.Fin}
                  onChange={(event) =>
                    setRange((prev) => ({ ...prev, Fin: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Especialidad
                </label>
                <select
                  value={especialidadFiltro}
                  onChange={(event) => setEspecialidadFiltro(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                >
                  <option value="">Todas</option>
                  {especialidadesCatalogo.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <p>
                Periodo: <strong>{range.Inicio}</strong> a{' '}
                <strong>{range.Fin}</strong>
              </p>
              <Button
                onClick={fetchReport}
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-600 hover:to-blue-700 disabled:opacity-60"
              >
                {loading ? 'Generando...' : 'Generar reporte'}
              </Button>
            </div>
          </Card>

          {renderBody()}
        </div>
      </div>
    </div>
  );
}






