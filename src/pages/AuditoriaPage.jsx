// src/pages/AuditoriaPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Layout/Sidebar';
import { Header } from '../components/Layout/Header';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import api from '../services/api';

const PAGE_SIZE = 20;

export default function AuditoriaPage({ user }) {
  const [auditoria, setAuditoria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchAuditoria = async () => {
      try {
        const res = await api.get('/auditoria?limit=2000');
        const records = Array.isArray(res.data?.records) ? res.data.records : [];
        records.sort((a, b) => {
          const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
          const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
          if (fechaA.getTime() === fechaB.getTime()) {
            return (b.id || 0) - (a.id || 0);
          }
          return fechaB - fechaA;
        });
        setAuditoria(records);
      } catch (error) {
        console.error('Error al cargar auditoría:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditoria();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [auditoria.length]);

  const { totalPages, pageItems, startIndex, endIndex } = useMemo(() => {
    const total = Math.max(1, Math.ceil(auditoria.length / PAGE_SIZE));
    const safePage = Math.min(page, total);
    const start = (safePage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, auditoria.length);
    return {
      totalPages: total,
      pageItems: auditoria.slice(start, end),
      startIndex: start,
      endIndex: end,
    };
  }, [auditoria, page]);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <Header
            title="Auditoría"
            subtitle="Bitácora completa de acciones del sistema"
          />

          <Card className="rounded-3xl border border-white bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur">
            {loading ? (
              <div className="h-96 animate-pulse rounded-2xl bg-slate-100/70" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Usuario</th>
                      <th className="px-6 py-3">Acción</th>
                      <th className="px-6 py-3">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
                    {pageItems.map((record) => (
                      <tr key={record.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          {record.fecha
                            ? new Date(record.fecha).toLocaleString('es-ES')
                            : '—'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {record.usuario?.nombre || 'Usuario eliminado'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            {record.accion}
                          </span>
                        </td>
                        <td className="max-w-xs break-words px-6 py-4">
                          {record.detalle || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-slate-500">
                  <span>
                    Mostrando {auditoria.length === 0 ? 0 : startIndex + 1} a{' '}
                    {endIndex} de {auditoria.length} movimientos
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs"
                      disabled={page === 1}
                      onClick={() => goToPage(1)}
                    >
                      Primera
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs"
                      disabled={page === 1}
                      onClick={() => goToPage(page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="px-2 text-xs font-semibold text-slate-600">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs"
                      disabled={page === totalPages}
                      onClick={() => goToPage(page + 1)}
                    >
                      Siguiente
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs"
                      disabled={page === totalPages}
                      onClick={() => goToPage(totalPages)}
                    >
                      Última
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
