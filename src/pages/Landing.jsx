import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
  ArrowRight, 
  Shield, 
  BarChart3, 
  Wrench, 
  Users, 
  Clock,
  CheckCircle,
  Star,
  Monitor,
  Database
} from 'lucide-react';

const Landing = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });
  }, []);

  const features = [
    {
      icon: Monitor,
      title: "Real-time Monitoring",
      description: "Pantau status equipment secara real-time dengan dashboard yang informatif dan mudah dipahami."
    },
    {
      icon: Wrench,
      title: "Manajemen Breakdown",
      description: "Kelola data kerusakan equipment dengan sistem yang terstruktur dan terintegrasi."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Dapatkan insight mendalam dengan laporan analisis performance equipment yang komprehensif."
    },
    {
      icon: Users,
      title: "Multi-User Access",
      description: "Sistem role-based access untuk Administrator, Inputer, dan Viewer dengan hak akses yang sesuai."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Keamanan data terjamin dengan sistem autentikasi yang robust dan backup otomatis."
    },
    {
      icon: Clock,
      title: "Efficient Workflow",
      description: "Streamline proses maintenance dengan workflow yang efisien dari breakdown hingga RFU."
    }
  ];

  const stats = [
    { number: "99.9%", label: "Uptime", description: "System Availability" },
    { number: "50+", label: "Equipment", description: "Managed Daily" },
    { number: "24/7", label: "Support", description: "Always Available" },
    { number: "100%", label: "Secure", description: "Data Protection" }
  ];

  const testimonials = [
    {
      name: "Budi Santoso",
      role: "Maintenance Manager",
      company: "PT. Industrial Solutions",
      image: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150",
      quote: "SMBE telah mengubah cara kami mengelola maintenance. Efisiensi meningkat drastis dan downtime berkurang signifikan."
    },
    {
      name: "Sari Wijaya",
      role: "Operations Director", 
      company: "CV. Teknik Mandiri",
      image: "https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg?auto=compress&cs=tinysrgb&w=150",
      quote: "Interface yang intuitif dan fitur yang lengkap membuat pekerjaan tim maintenance menjadi lebih terorganisir dan produktif."
    },
    {
      name: "Ahmad Rahman",
      role: "Plant Manager",
      company: "PT. Manufacturing Plus",
      image: "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=150",
      quote: "Reporting yang detail dan real-time monitoring sangat membantu dalam pengambilan keputusan strategis."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SMBE</h1>
                <p className="text-xs text-gray-500">Sistem Manajemen Breakdown Equipment</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Mulai Sekarang
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary-50 via-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Kelola Equipment 
                <span className="text-primary-600 block">Lebih Efisien</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Sistem manajemen breakdown equipment yang komprehensif untuk meningkatkan efisiensi maintenance, 
                mengurangi downtime, dan mengoptimalkan performance industrial equipment Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Mulai Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-600 bg-white border-2 border-primary-600 rounded-xl hover:bg-primary-50 transition-colors">
                  Lihat Demo
                </button>
              </div>
            </div>
            <div data-aos="fade-left" className="relative">
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Industrial Equipment"
                  className="rounded-2xl shadow-2xl w-full"
                />
                <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4 animate-bounce-slow">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-semibold text-gray-900">Equipment Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-xl font-semibold text-primary-100 mb-1">
                  {stat.label}
                </div>
                <div className="text-primary-200 text-sm">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fitur Lengkap & Powerful
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola equipment breakdown secara efektif dan efisien
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dipercaya Industri
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Lihat apa yang dikatakan klien kami tentang pengalaman menggunakan SMBE
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-8 relative"
                data-aos="fade-up"
                data-aos-delay={index * 200}
              >
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Siap Meningkatkan Efisiensi Equipment Anda?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ratusan perusahaan yang sudah merasakan manfaat SMBE. 
            Mulai trial gratis hari ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-600 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
            >
              Mulai Trial Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-xl hover:bg-white hover:text-primary-600 transition-colors">
              Hubungi Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">SMBE</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Sistem Manajemen Breakdown Equipment yang membantu perusahaan industri 
                mengoptimalkan maintenance dan mengurangi downtime equipment.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produk</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Fitur</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Harga</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Dukungan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Dokumentasi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SMBE. All rights reserved. Built with ❤️ for Indonesian Industry.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;