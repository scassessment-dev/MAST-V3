import { TEST_BLOCKS } from "@mast/core";
import TestForm from "./test-form";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-gold">MAST</p>
          <h1 className="mt-3 break-normal text-4xl font-black leading-tight text-ink sm:text-6xl sm:leading-none lg:text-7xl">
            MAST Assessment
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-8 text-slate-600">
            Name, age અને center ભરીને સૂચનાઓ વાંચો. Confirmation પછી questions શરૂ થશે.
          </p>
        </div>
        <TestForm blocks={TEST_BLOCKS} />
      </section>
    </main>
  );
}
