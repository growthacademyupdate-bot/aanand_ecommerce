"use client";

import { Suspense } from "react";
import OrderSuccess from "@/pages/OrderSuccess";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccess />
    </Suspense>
  );
}
