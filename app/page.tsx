export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <h1 className="text-5xl md:text-6xl font-bold tracking-wide">
          DIVE IN
        </h1>

        <p className="mt-4 text-gray-400 text-lg md:text-xl max-w-xl">
          Discover. Create. Collaborate.
        </p>

        <p className="mt-6 text-gray-500 max-w-2xl">
          A creative space where artists, writers, singers, dancers and
          innovators connect, build projects together and grow.
        </p>

        <div className="mt-10 flex gap-4">
          <a
            href="/signup"
            className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Get Started
          </a>

          <a
            href="/login"
            className="px-6 py-3 border border-white rounded-lg hover:bg-white hover:text-black transition"
          >
            Sign In
          </a>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="bg-white text-black py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 text-center">

          <div>
            <h3 className="text-xl font-semibold mb-3">
              Discover Talent
            </h3>
            <p className="text-gray-600">
              Explore creative works from passionate creators across multiple categories.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">
              Collaborate Easily
            </h3>
            <p className="text-gray-600">
              Send collaboration requests, build together and bring ideas to life.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">
              Grow Your Skills
            </h3>
            <p className="text-gray-600">
              Track progress, gain recognition and unlock new creative opportunities.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-800">
        © {new Date().getFullYear()} DIVE IN. All rights reserved.
      </footer>

    </main>
  );
}