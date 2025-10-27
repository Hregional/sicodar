import React, { useEffect, useState } from 'react'
import { Sidebar } from '../components/Layout/Sidebar'
import { Header } from '../components/Layout/Header'
import { Card } from '../components/UI/Card'
import api from '../services/api'

export default function StockBajoPage({ user }) {
  const [insumosBajoStock, setInsumosBajoStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStockBajo = async () => {
      try {
        const res = await api.get('/reporte-stock')
        const bajoStock = (res.data || []).filter(
          (item) => item.stock_minimo > 0 && item.stock_actual < item.stock_minimo
        )
        setInsumosBajoStock(bajoStock)
      } catch (err) {
        setError('Error al cargar los insumos con stock bajo')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStockBajo()
  }, [])

  return (
    <div className="flex">
      <Sidebar user={user} />
      <div className="flex-1 p-8">
        <Header title="Stock Bajo" subtitle="Insumos por debajo del nivel mínimo definido" />
        <Card>
          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="h-96 animate-pulse rounded bg-gray-200" />
          ) : insumosBajoStock.length === 0 ? (
            <p className="py-8 text-center text-gray-600">No hay insumos con stock bajo en este momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Insumo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Especialidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Stock actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Stock mínimo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Alertas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {insumosBajoStock.map((item, index) => (
                    <tr key={item.id ?? `stock-${index}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.especialidad_nombre ||
                          item.especialidad?.nombre ||
                          'Sin especialidad'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.stock_actual}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.stock_minimo}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          {item.alertas || 0} alertas
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
