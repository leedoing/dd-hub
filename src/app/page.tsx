import { Suspense } from 'react';
import Home from "@/components/home/Home";
import Layout from "@/components/layout/Layout";

export default function Page() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      }>
        <Home />
      </Suspense>
    </Layout>
  );
}