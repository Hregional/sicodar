// src/pages/AlertasPage.jsx
import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Layout/Sidebar';
import { Header } from '../components/Layout/Header';
import { Card } from '../components/UI/Card';
import api from '../services/api';

export default function AlertasPage({ user }) {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const res = await api.get('/alertas?limit=1000');
        setAlertas(res.data);
      } catch (error) {
        console.error('Error al cargar alertas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlertas();
  }, []);

  return (
    <div className="flex">
      <Sidebar user={user} />
      <div className="flex-1 p-8">
        <Header title="Alertas" subtitle="Notificaciones del sistema" />

        <Card>
          {loading ? (
            <div className="animate-pulse h-96 bg-gray-200 rounded"></div>
          ) : alertas.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No hay alertas activas.</p>
          ) : (
            <div className="space-y-4">
              {alertas.map((alerta) => (
                <div key={alerta.id} className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                  <p className="font-medium">{alerta.mensaje}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(alerta.fecha).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
