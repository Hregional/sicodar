// src/pages/ProximosAVencerPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Layout/Sidebar';
import api from '../services/api';
import { CalendarClock } from 'lucide-react';

const filterOptions = [
  { value: 7, label: '7 días' },
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
  { value: 60, label: '60 días' },
  { value: 90, label: '90 días' },
];

const normalizeNombre = (item) => {
  const candidate =
    item?.insumo?.nombre ??
    item?.nombre ??
    item?.insumo_nombre ??
    item?.descripcion ??
    item?.insumo;

  if (!candidate) {
    return 'Insumo sin nombre';
  }

  if (typeof candidate === 'string') {
    return candidate;
  }

  if (Array.isArray(candidate)) {
    return candidate.map(normalizeNombre).join(', ') || 'Insumo sin nombre';
  }

  if (typeof candidate === 'object') {
    return (
      candidate.nombre ||
      candidate.descripcion ||
      candidate.id ||
      JSON.stringify(candidate)
    );
  }

  return String(candidate);
};

export default function ProximosAVencerPage({ user }) {
  const [proximosAVencer, setProximosAVencer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diasFiltro, setDiasFiltro] = useState(30);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .get(`/reportes/proximos-a-vencer?dias=${diasFiltro}`)
      .then((res) => {
        if (!mounted) return;
        const resultados = res.data?.resultados || res.data || [];
        setProximosAVencer(Array.isArray(resultados) ? resultados : []);
      })
      .catch((error) => {
        console.error('Error al cargar insumos próximos a vencer:', error);
        if (mounted) {
          setProximosAVencer([]);
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [diasFiltro]);

  const filas = useMemo(
    () =>
      proximosAVencer.map((item) => ({
        id: `${item.insumo_id ?? normalizeNombre(item)}-${item.numero_lote ?? ''}`,
        nombre: normalizeNombre(item),
        numero_lote: item.numero_lote || '-',
        fecha_vencimiento: item.fecha_vencimiento
          ? new Date(item.fecha_vencimiento).toLocaleDateString('es-ES')
          : 'Sin fecha',
        cantidad: Number(item.stock_disponible ?? item.cantidad ?? 0),
      })),
    [proximosAVencer]
  );
  const totalFilas = filas.length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <section className="rounded-3xl border border-white bg-white/95 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-sky-100 p-3 text-sky-600">
                  <CalendarClock size={26} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Próximos a Vencer
                  </h1>
                  <p className="text-sm font-medium text-slate-500">
                    Insumos con fecha de vencimiento más cercana
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                Mostrando {totalFilas} insumo(s) que vencen en los próximos:
                <select
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  value={diasFiltro}
                  onChange={(event) => setDiasFiltro(Number(event.target.value))}
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              {loading ? (
                <div className="h-64 animate-pulse bg-slate-100/70" />
              ) : filas.length === 0 ? (
                <p className="bg-slate-50 py-10 text-center text-sm text-slate-500">
                  No hay insumos próximos a vencer con el filtro seleccionado.
                </p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-600">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Insumo</th>
                      <th className="px-6 py-4">Lote</th>
                      <th className="px-6 py-4">Fecha de Vencimiento</th>
                      <th className="px-6 py-4 text-right">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filas.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 text-sm font-medium text-sky-700">
                          {item.nombre}
                        </td>
                        <td className="px-6 py-4">{item.numero_lote}</td>
                        <td className="px-6 py-4">{item.fecha_vencimiento}</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-700">
                          {item.cantidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
