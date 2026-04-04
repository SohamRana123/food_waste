import Head from "next/head";
import { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Head>
        <title>Kitchen Demand Command Center</title>
        <meta
          name="description"
          content="AI-powered demand forecasting and food waste optimization for university hostel kitchens in Kolkata. Reduce waste by up to 25%, save costs, and improve service levels."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f766e" />
      </Head>
      <div className="page-shell">
        <header className="hero-panel">
          <div>
            <p className="eyebrow">AI-Powered Optimization</p>
            <h1>Kitchen Demand Command Center</h1>
            <p className="hero-copy">
              Harness machine learning to predict demand precisely, reduce food waste, optimize costs,
              and improve service levels across Kolkata university hostel kitchens.
            </p>
          </div>
          <div className="hero-stat-block">
            <span>Full MLOps Pipeline</span>
            <strong style={{ fontSize: '1.1rem' }}>
              Data → Features → Models → Optimization → Feedback
            </strong>
          </div>
        </header>
        <main className="content-grid">{children}</main>
      </div>
    </>
  );
}
