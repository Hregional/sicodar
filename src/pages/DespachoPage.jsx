import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Layout/Sidebar';
import { Button } from '../components/UI/Button';
import api from '../services/api';
import { generatePdfFromElement } from '../utils/PdfGenerator';
import { FileOutput, Loader2 } from 'lucide-react';

const currency = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
});

export default function DespachoPage({ user }) {
  const [requisiciones, setRequisiciones] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [documento, setDocumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarRequisiciones = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/requisiciones?limit=200');
        const lista = Array.isArray(data) ? data : [];
        setRequisiciones(lista);
        if (lista.length > 0) {
          setSelectedId(lista[0].id);
        }
      } catch (err) {
        console.error('No se pudieron cargar requisiciones', err);
        setError('No se pudo cargar el historial de requisiciones.');
      } finally {
        setLoading(false);
      }
    };
    cargarRequisiciones();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const cargarDocumento = async () => {
      setDocLoading(true);
      try {
        const { data } = await api.get(`/requisiciones/${selectedId}/despacho`);
        setDocumento(data);
      } catch (err) {
        console.error('No se pudo obtener el despacho', err);
        setError('No se pudo obtener la hoja de despacho seleccionada.');
      } finally {
        setDocLoading(false);
      }
    };
    cargarDocumento();
  }, [selectedId]);

  const total = useMemo(
    () =>
      (documento?.lineas || []).reduce(
        (acc, linea) => acc + Number(linea.subtotal || 0),
        0
      ) || 0,
    [documento]
  );

  const lineas = documento?.lineas || [];

  const downloadPdf = () =>
    generatePdfFromElement(
      'despacho-producto-hoja',
      `despacho-${documento?.numero || 'documento'}.pdf`
    );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
                Despacho
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Despacho de Productos
              </h1>
              <p className="text-sm text-slate-500">
                Consulta y descarga las hojas oficiales generadas desde cada requisición.
              </p>
            </div>
            {documento && (
              <Button
                variant="outline"
                className="rounded-full text-xs"
                onClick={downloadPdf}
                disabled={docLoading}
              >
                <FileOutput className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            )}
          </header>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Requisiciones disponibles
                </h2>
                <p className="text-sm text-slate-500">
                  Selecciona una requisición para consultar su despacho.
                </p>
              </div>
              {loading ? (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando requisiciones...
                </p>
              ) : requisiciones.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aún no hay requisiciones registradas.
                </p>
              ) : (
                <div className="max-h-[460px] space-y-3 overflow-auto pr-2">
                  {requisiciones.map((req) => (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => setSelectedId(req.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        selectedId === req.id
                          ? 'border-sky-200 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">
                        #{req.numero} · {req.servicio}
                      </p>
                      <p className="text-xs text-slate-500">
                        {req.fecha
                          ? new Date(req.fecha).toLocaleDateString('es-GT')
                          : 'Sin fecha'}{' '}
                        · {req.detalles?.length || 0} productos
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-white bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              {docLoading || !documento ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  {docLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparando hoja de despacho...
                    </span>
                  ) : (
                    'Selecciona una requisición para visualizar su despacho.'
                  )}
                </div>
              ) : (
                <div
                  id="despacho-producto-hoja"
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-inner"
                >
                  <div className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Bodega de Médico Quirúrgico
                    <div className="text-base tracking-tight text-slate-900">
                      Despacho de Producto
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                    <p>
                      Servicio:{' '}
                      <span className="font-semibold text-slate-900">
                        {documento.servicio}
                      </span>
                    </p>
                    <p>
                      No. Requisición:{' '}
                      <span className="font-semibold text-slate-900">
                        {documento.numero}
                      </span>
                    </p>
                    <p>
                      Fecha:{' '}
                      <span className="font-semibold text-slate-900">
                        {new Date(documento.fecha).toLocaleDateString('es-GT')}
                      </span>
                    </p>
                    <p>
                      Ingreso a Sistema:{' '}
                      <span className="font-semibold text-slate-900">
                        {documento.ingreso_sistema || '—'}
                      </span>
                    </p>
                    <p>
                      Comentario:{' '}
                      <span className="font-semibold text-slate-900">
                        {documento.comentario || 'Sin comentario'}
                      </span>
                    </p>
                    <p>
                      Total:{' '}
                      <span className="font-semibold text-slate-900">
                        {currency.format(documento.total ?? total)}
                      </span>
                    </p>
                  </div>

                  <table className="mt-5 w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="border border-slate-300 px-2 py-1 text-left w-16">
                          Cantidad
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-left">
                          Producto
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-24">
                          Precio
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-24">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineas.map((linea, idx) => (
                        <tr key={`${linea.producto}-${idx}`}>
                          <td className="border border-slate-200 px-2 py-1">
                            {linea.cantidad}
                          </td>
                          <td className="border border-slate-200 px-2 py-1">
                            {linea.producto}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-right">
                            {currency.format(linea.precio || 0)}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 text-right">
                            {currency.format(linea.subtotal || 0)}
                          </td>
                        </tr>
                      ))}
                      {lineas.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="border border-slate-200 px-2 py-4 text-center text-slate-500"
                          >
                            No hay productos registrados en el despacho.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td
                          colSpan={3}
                          className="border border-slate-200 px-2 py-2 text-right font-semibold"
                        >
                          Total
                        </td>
                        <td className="border border-slate-200 px-2 py-2 text-right font-semibold">
                          {currency.format(total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  <p className="mt-4 text-center text-[11px] uppercase tracking-[0.3em] text-slate-400">
                    Última línea
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
