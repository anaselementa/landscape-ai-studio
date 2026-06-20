"use client";

export function PrintButton() {
  return (
    <button className="btn-primary" onClick={() => window.print()} type="button">
      Imprimer / Export PDF
    </button>
  );
}
