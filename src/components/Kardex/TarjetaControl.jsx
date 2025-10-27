// src/components/Kardex/TarjetaControl.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../UI/Button";
import { exportToExcel } from "../../utils/excelExport";

const PAGE_SIZE = 10;

const quantityFormatter = new Intl.NumberFormat("es-GT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    const first = value[0];
    return first ? normalizeText(first) : "";
  }
  if (typeof value === "object") {
    return (
      value.nombre ||
      value.descripcion ||
      value.razon_social ||
      value.id ||
      JSON.stringify(value)
    ).trim();
  }
  return String(value).trim();
};

const normalizeMovimientos = (movimientos) => {
  const base = Array.isArray(movimientos)
    ? movimientos
    : Array.isArray(movimientos?.movimientos)
    ? movimientos.movimientos
    : [];

  return base
    .map((mov) => ({
      ...mov,
      fecha: mov.fecha || mov.created_at || mov.updated_at || null,
      cantidad: Number(mov.cantidad) || 0,
      precio_unitario:
        mov.precio_unitario !== undefined && mov.precio_unitario !== null
          ? Number(mov.precio_unitario)
          : 0,
      numero_referencia: normalizeText(mov.numero_referencia || mov.referencia),
      remitente_destinatario: normalizeText(
        mov.remitente_destinatario || mov.proveedor || mov.destinatario
      ),
      numero_lote: normalizeText(mov.numero_lote || mov.lote),
      fecha_vencimiento: mov.fecha_vencimiento || mov.vencimiento || null,
      tipo: (mov.tipo || mov.movimiento_tipo || "").toUpperCase(),
      precio_total: Number(mov.precio_total) || 0,
    }))
    .sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha) : new Date("1900-01-01");
      const fechaB = b.fecha ? new Date(b.fecha) : new Date("1900-01-01");
      if (fechaA.getTime() === fechaB.getTime()) {
        if (a.tipo !== b.tipo) {
          return a.tipo === "ENTRADA" ? -1 : 1;
        }
        return (a.id || 0) - (b.id || 0);
      }
      return fechaA - fechaB;
    });
};

export function TarjetaControl({ insumo, movimientos, onRegistrarEntrada }) {
  const [page, setPage] = useState(1);

  const { rows, totalStock, totalValor } = useMemo(() => {
    const lista = normalizeMovimientos(movimientos);

    const netCantidad = lista.reduce((acc, item) => {
      if (item.tipo === "ENTRADA") return acc + item.cantidad;
      if (item.tipo === "SALIDA") return acc - item.cantidad;
      return acc;
    }, 0);

    const netValor = lista.reduce((acc, item) => {
      const total = item.cantidad * item.precio_unitario;
      if (item.tipo === "ENTRADA") return acc + total;
      if (item.tipo === "SALIDA") return acc - total;
      return acc;
    }, 0);

    const saldoReferenciaRaw =
      insumo?.stock_calculado ?? insumo?.stock_actual ?? netCantidad;
    const saldoFinal = Number.isFinite(Number(saldoReferenciaRaw))
      ? Number(saldoReferenciaRaw)
      : netCantidad;

    const valorReferenciaRaw =
      insumo?.valor_stock_total ?? insumo?.valor_calculado ?? netValor;
    const valorFinal = Number.isFinite(Number(valorReferenciaRaw))
      ? Number(valorReferenciaRaw)
      : netValor;

    let saldoCantidad = 0;
    let saldoValor = 0;

    const detalle = lista.map((mov) => {
      const cantidad = Math.abs(mov.cantidad);
      const promedio = saldoCantidad > 0 ? saldoValor / saldoCantidad : 0;

      let precioUnitario = mov.precio_unitario || 0;
      let total = precioUnitario * cantidad;

      if (mov.tipo === "ENTRADA") {
        if (precioUnitario <= 0 && cantidad > 0) {
          const totalDeclarado = mov.precio_total || 0;
          precioUnitario = totalDeclarado && cantidad ? totalDeclarado / cantidad : promedio;
          total = precioUnitario * cantidad;
        }
        saldoCantidad += cantidad;
        saldoValor += total;
      } else if (mov.tipo === "SALIDA") {
        if (precioUnitario <= 0) {
          precioUnitario = promedio;
          total = precioUnitario * cantidad;
        }
        saldoCantidad -= cantidad;
        saldoValor -= total;
      }

      return {
        fecha: mov.fecha ? new Date(mov.fecha).toLocaleDateString("es-ES") : "-",
        numero_referencia: mov.numero_referencia || "-",
        remitente_destinatario: mov.remitente_destinatario || "-",
        fecha_vencimiento: mov.fecha_vencimiento
          ? new Date(mov.fecha_vencimiento).toLocaleDateString("es-ES")
          : "-",
        numero_lote: mov.numero_lote || "-",
        precio_unitario: precioUnitario || null,
        tipo: mov.tipo,
        entradaCantidad: mov.tipo === "ENTRADA" ? cantidad : null,
        entradaTotal: mov.tipo === "ENTRADA" ? total : null,
        salidaCantidad: mov.tipo === "SALIDA" ? cantidad : null,
        salidaTotal: mov.tipo === "SALIDA" ? total : null,
        saldoCantidad,
        saldoValor,
      };
    });

    const rowsWithSaldo = [
      {
        tipo: "SALDO_INICIAL",
        fecha: "",
        numero_referencia: "",
        remitente_destinatario: "SALDO INICIAL",
        fecha_vencimiento: "",
        numero_lote: "",
        precio_unitario: null,
        entradaCantidad: null,
        entradaTotal: null,
        salidaCantidad: null,
        salidaTotal: null,
        saldoCantidad: 0,
        saldoValor: 0,
      },
      ...detalle,
    ];

    return {
      rows: rowsWithSaldo,
      totalStock: saldoCantidad,
      totalValor: saldoValor,
    };
  }, [insumo, movimientos]);

  

    const displayRows = useMemo(() => {
    if (!rows || rows.length <= 1) return rows;
    const [saldoInicialRow, ...resto] = rows;
    return [saldoInicialRow, ...resto.slice().reverse()];
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil((displayRows?.length ?? 0) / PAGE_SIZE));
  const storageKey = insumo?.id ? `kardex_page_${insumo.id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
        setPage(parsed);
        return;
      }
    }
    setPage(1);
  }, [storageKey, totalPages]);

  useEffect(() => {
    if (!storageKey) return;
    sessionStorage.setItem(storageKey, String(page));
  }, [page, storageKey]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, displayRows?.length ?? 0);

  const pageRows = displayRows ? displayRows.slice(startIndex, endIndex) : [];
  const formatCantidad = (value) =>
    value === null || value === undefined ? "-" : quantityFormatter.format(value);

  const formatMoneda = (value) =>
    value === null || value === undefined ? "-" : currencyFormatter.format(value);

  const handleChangePage = (next) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
  };

  const handleExport = () => {
    const dataset = rows.map((row, index) => ({
      Fila: index + 1,
      Fecha: row.fecha || "",
      "Numero referencia": row.numero_referencia || "",
      "Remitente / Destinatario": row.remitente_destinatario || "",
      "Entrada cantidad": row.entradaCantidad || 0,
      "Entrada total": row.entradaTotal || 0,
      "Fecha vencimiento": row.fecha_vencimiento || "",
      "Numero lote": row.numero_lote || "",
      "Salida cantidad": row.salidaCantidad || 0,
      "Salida total": row.salidaTotal || 0,
      "Saldo cantidad": row.saldoCantidad || 0,
      "Saldo valor": row.saldoValor || 0,
      "Precio unitario": row.precio_unitario || 0,
    }));

    exportToExcel(dataset, `kardex_${insumo?.nombre || "insumo"}`);
  };

  const handlePrint = () => {
    const printableRows = pageRows.length ? pageRows : displayRows || [];
    const printRows = printableRows
      .map((row) => {
        const cells = [
          row.fecha || "-",
          row.numero_referencia || "-",
          row.remitente_destinatario || "-",
          formatCantidad(row.entradaCantidad),
          formatMoneda(row.entradaTotal),
          row.fecha_vencimiento || "-",
          row.numero_lote || "-",
          formatCantidad(row.salidaCantidad),
          formatMoneda(row.salidaTotal),
          formatCantidad(row.saldoCantidad),
          formatMoneda(row.saldoValor),
          formatMoneda(row.precio_unitario),
        ];
        return `<tr>${cells
          .map((value, index) =>
            index >= 3 ? `<td class="numeric">${value}</td>` : `<td class="text">${value}</td>`
          )
          .join("")}</tr>`;
      })
      .join("");

    const summaryHtml = `
      <div class="summary">
        <div>Stock total disponible: <strong>${formatCantidad(totalStock)}</strong></div>
        <div>Valor total del stock: <strong>${formatMoneda(totalValor)}</strong></div>
      </div>
    `;

    const win = window.open("", "_blank", "width=1024,height=750");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Kardex — ${insumo?.nombre || "Insumo"}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 24px; color: #0f172a; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #475569; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; }
    th { background: #f8fafc; text-transform: uppercase; font-size: 10px; font-weight: 600; color: #475569; }
    td.text { text-align: left; white-space: nowrap; }
    td.numeric { text-align: right; white-space: nowrap; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:first-child { background: #e0f2fe; }
    .summary { margin-top: 16px; padding: 12px 16px; display: flex; gap: 32px; border: 1px solid #bbf7d0; background: #ecfdf5; border-radius: 12px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>TARJETA DE CONTROL DE SUMINISTROS</h1>
  <div class="subtitle">
    ${insumo?.nombre || "Insumo"} — Stock actual: ${formatCantidad(insumo?.stock_actual ?? 0)} ${insumo?.unidad_medida || "unidades"}
  </div>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Numero referencia</th>
        <th>Remitente / Destinatario</th>
        <th>Entrada cantidad</th>
        <th>Entrada total</th>
        <th>Fecha vencimiento</th>
        <th>Numero lote</th>
        <th>Salida cantidad</th>
        <th>Salida total</th>
        <th>Saldo cantidad</th>
        <th>Saldo valor</th>
        <th>Precio unitario</th>
      </tr>
    </thead>
    <tbody>${printRows}</tbody>
  </table>
  ${summaryHtml}
</body>
</html>`);

    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const navButton = (label, disabled, action) => (
    <Button
      variant="outline"
      className="rounded-full px-3 py-1 text-xs"
      disabled={disabled}
      onClick={action}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          TARJETA DE CONTROL DE SUMINISTROS
        </h2>
        <p className="text-xs text-slate-500">
          No. {insumo?.codigo || insumo?.id || "N/A"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-100 text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Numero referencia</th>
              <th className="px-3 py-2 text-left">Remitente / Destinatario</th>
              <th className="px-3 py-2 text-right">Entrada cantidad</th>
              <th className="px-3 py-2 text-right">Entrada total</th>
              <th className="px-3 py-2 text-left">Fecha vencimiento</th>
              <th className="px-3 py-2 text-left">Numero lote</th>
              <th className="px-3 py-2 text-right">Salida cantidad</th>
              <th className="px-3 py-2 text-right">Salida total</th>
              <th className="px-3 py-2 text-right">Saldo cantidad</th>
              <th className="px-3 py-2 text-right">Saldo valor</th>
              <th className="px-3 py-2 text-right">Precio unitario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pageRows.map((row, index) => {
              const isInitial = row.tipo === "SALDO_INICIAL";
              return (
                <tr
                  key={`${row.numero_referencia}-${index}-${row.fecha}`}
                  className={isInitial ? "bg-sky-50/60" : ""}
                >
                  <td className="px-3 py-2 text-xs text-slate-600">{row.fecha || "-"}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{row.numero_referencia || "-"}</td>
                  <td className="px-3 py-2 text-xs font-medium text-slate-700">
                    {row.remitente_destinatario || "-"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">{formatCantidad(row.entradaCantidad)}</td>
                  <td className="px-3 py-2 text-right text-xs">{formatMoneda(row.entradaTotal)}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{row.fecha_vencimiento || "-"}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{row.numero_lote || "-"}</td>
                  <td className="px-3 py-2 text-right text-xs">{formatCantidad(row.salidaCantidad)}</td>
                  <td className="px-3 py-2 text-right text-xs">{formatMoneda(row.salidaTotal)}</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-slate-800">{formatCantidad(row.saldoCantidad)}</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-slate-800">{formatMoneda(row.saldoValor)}</td>
                  <td className="px-3 py-2 text-right text-xs">{formatMoneda(row.precio_unitario)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 md:grid-cols-2">
        <div className="font-semibold">
          Stock total disponible: {formatCantidad(totalStock)}
        </div>
        <div className="font-semibold">
          Valor total del stock: {formatMoneda(totalValor)}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Mostrando {rows.length === 0 ? 0 : startIndex + 1} a {endIndex} de {rows.length} movimientos
        </span>
        <div className="flex items-center gap-2">
          {navButton("Primera", page === 1, () => handleChangePage(1))}
          {navButton("Anterior", page === 1, () => handleChangePage(page - 1))}
          <span className="px-2 py-1 text-xs font-semibold text-slate-600">
            Pagina {page} de {totalPages}
          </span>
          {navButton("Siguiente", page === totalPages, () => handleChangePage(page + 1))}
          {navButton("Ultima", page === totalPages, () => handleChangePage(totalPages))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-600 hover:to-blue-700"
          onClick={onRegistrarEntrada}
        >
          Registrar nueva entrada
        </Button>
        <Button variant="success" className="rounded-full px-5 py-2 text-sm" onClick={handleExport}>
          Exportar a Excel
        </Button>
        <Button variant="purple" className="rounded-full px-5 py-2 text-sm" onClick={handlePrint}>
          Imprimir Kardex
        </Button>
      </div>
    </div>
  );
}

