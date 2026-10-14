import "./purchase-success.css";

export default function PurchaseSuccessLoading() {
  return (
    <main className="purchase-page">
      <div className="purchase-frame">
        <span role="status" className="sr-only">
          Loading your purchase
        </span>
        <div className="purchase-loading" aria-hidden="true">
          <div className="purchase-loading-title" />
          <div className="purchase-loading-line" />
          <div className="purchase-loading-line" />
          <div className="purchase-loading-action" />
          <div className="purchase-loading-art" />
          <div className="purchase-loading-receipt" />
        </div>
      </div>
    </main>
  );
}
