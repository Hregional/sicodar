// src/pages/KardexPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../components/Layout/Sidebar';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { TarjetaControl } from '../components/Kardex/TarjetaControl';
import api from '../services/api';
import { ArrowLeft, Package } from 'lucide-react';

export default function KardexPage({ user }) {
  const { insumoId } = useParams();
  const navigate = useNavigate();
  const [insumo, setInsumo] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!insumoId) {
      setLoading(false);
      setError('No se proporcionó un identificador de insumo.');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [kardexRes, insumoRes] = await Promise.all([
          api.get(`/kardex/${insumoId}`),
          api.get(`/insumos/${insumoId}`),
        ]);

        const kardexPayload = kardexRes.data;
        const movimientosObtenidos = Array.isArray(kardexPayload?.movimientos)
          ? kardexPayload.movimientos
          : Array.isArray(kardexPayload)
          ? kardexPayload
          : [];

        setMovimientos(movimientosObtenidos);
        setInsumo({
          ...(insumoRes.data || {}),
          ...(kardexPayload?.insumo || {}),
        });
      } catch (err) {
        console.error('Error cargando kardex:', err);
        setError('No se pudo cargar la información del kardex.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [insumoId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <Sidebar user={user} />
        <div className="flex-1 px-8 py-10">
          <div className="mx-auto w-full max-w-5xl rounded-3xl border border-white bg-white/95 p-10 shadow-lg">
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100/70" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <Sidebar user={user} />
        <div className="flex-1 px-8 py-10">
          <div className="mx-auto w-full max-w-4xl rounded-3xl border border-red-100 bg-white p-10 text-center shadow-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              className="rounded-full px-4 py-2 text-sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-sky-100 p-3 text-sky-600">
                <Package size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Kardex — {insumo?.nombre || 'Insumo'}
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  Stock actual: {insumo?.stock_actual ?? 0}{' '}
                  {insumo?.unidad_medida || 'unidad'}
                </p>
              </div>
            </div>
          </div>

          <Card className="rounded-3xl border border-white bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
            <TarjetaControl
              insumo={insumo}
              movimientos={movimientos}
              onRegistrarEntrada={() => navigate('/movimientos')}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
