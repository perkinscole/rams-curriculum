import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="w-full bg-[#8B1A1A] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Image src="/logo.png" alt="RAMS" width={120} height={120} className="mx-auto mb-6 rounded-full border-4 border-white/30" />
          <h1 className="text-4xl font-bold mb-2">RAMS Curriculum Manager</h1>
          <p className="text-red-200 text-lg mb-1">Robert Adams Middle School</p>
          <p className="text-red-300 text-sm italic mb-8">Personal, Local, Global</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/curriculum"
              className="bg-white text-[#8B1A1A] px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition"
            >
              Browse Curriculum
            </Link>
            <Link
              href="/login"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6 w-full">
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-[#8B1A1A]">
          <h3 className="font-bold text-lg mb-2 text-gray-800">Understanding by Design</h3>
          <p className="text-gray-600 text-sm">
            Our curriculum follows the UBD framework with three stages: Desired Results,
            Evidence of Learning, and Learning Plan.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-[#8B1A1A]">
          <h3 className="font-bold text-lg mb-2 text-gray-800">Grades 6-8</h3>
          <p className="text-gray-600 text-sm">
            Browse curriculum documents across all subjects for grades 6, 7, and 8 including
            core academics and unified arts.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-[#8B1A1A]">
          <h3 className="font-bold text-lg mb-2 text-gray-800">Curriculum Connections</h3>
          <p className="text-gray-600 text-sm">
            Discover interdisciplinary opportunities across subjects using AI-powered
            curriculum analysis.
          </p>
        </div>
      </section>

      {/* Departments */}
      <section className="max-w-6xl mx-auto px-4 pb-12 w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Our Departments</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {['ELA', 'Mathematics', 'Science', 'Social Studies', 'Art', 'Computer Science', 'Music', 'Wellness', 'World Language'].map(dept => (
            <Link
              key={dept}
              href={`/curriculum?subject=${encodeURIComponent(dept === 'Computer Science' ? 'Computer Science / Digital Literacy' : dept)}`}
              className="bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition hover:border-[#8B1A1A] border border-transparent"
            >
              <span className="text-sm font-medium text-gray-700">{dept}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
