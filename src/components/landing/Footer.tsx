import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-24 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Left Section */}
          <div className="md:col-span-1">
            <p className="text-white text-2xl font-medium tracking-tight">Haciendo que Udreamms sea útil para todos</p>
            <div className="mt-8">
              <img src="/assets/Logo Udreamms.png" alt="Udreamms Logo" className="w-16 h-auto opacity-80 mb-4" />
              <p className="text-gray-500 text-sm">
                Tu puente seguro a los Estados Unidos.
                <br />
                Visa, Estudios, Vida.
              </p>
            </div>
          </div>

          {/* Programas Educativos / Visas */}
          <div className="mb-24">
            <h4 className="font-medium mb-3 text-sm text-slate-200">Visas y Programas</h4>
            <ul className="text-gray-400 space-y-2 text-sm mb-4">
              <li>
                <Link href="/visas/student" className="hover:text-primary transition-colors">Visa de Estudiante (F-1)</Link>
              </li>
              <li>
                <Link href="/visas/tourist" className="hover:text-primary transition-colors">Visa de Turismo (B1/B2)</Link>
              </li>
              <li>
                <Link href="/visas/fifa" className="hover:text-primary transition-colors">Experiencia FIFA 2026</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-primary transition-colors">Cursos de Inglés</Link>
              </li>
            </ul>

            <h4 className="font-medium mt-16 mb-3 text-sm text-slate-200">Confianza y Legal</h4>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">Transparencia en Visas</Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-primary transition-colors">Política de Privacidad</Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-primary transition-colors">Términos y Condiciones</Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-primary transition-colors">Soporte al Estudiante</Link>
              </li>
            </ul>
          </div>

          {/* Tu Vida en USA - CONECTADO A SERVICIOS */}
          <div className="mb-24">
            <h4 className="font-medium mb-3 text-sm text-slate-200">Ecosistema de Llegada</h4>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>
                <Link href="/services" className="hover:text-primary transition-colors">Vivienda Segura</Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors">Apertura de Cuenta Bancaria</Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors">Sim Card y Móvil</Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors">Transporte y Aeropuerto</Link>
              </li>
            </ul>

            {/* Sobre Udreamms */}
            <h4 className="font-medium mt-16 mb-3 text-sm text-slate-200">Sobre Udreamms</h4>
            <ul className="text-gray-400 space-y-2 text-sm mt-auto">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">Nuestra Historia</Link>
              </li>
              <li>
                <Link href="/referrals" className="hover:text-primary transition-colors">Programa de Afiliados</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">Contáctanos</Link>
              </li>
              <li className="pt-4">
                <span className="text-gray-400 block">📞 +1 650 784 0581</span>
                <span className="text-gray-400 block">✉️ udreamms@gmail.com</span>
                <span className="text-gray-400 block">📍 Salt Lake City, Utah</span>
              </li>
            </ul>
          </div>

          {/* Oportunidades y Destinos */}
          <div>
            <h4 className="font-medium mb-3 text-sm text-slate-200">Comunidad</h4>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>
                <Link href="/destinos" className="hover:text-primary transition-colors">Destinos Top en USA</Link>
              </li>
              <li>
                <Link href="/partnerships" className="hover:text-primary transition-colors">Universidades Aliadas</Link>
              </li>
              <li>
                <Link href="/#reviews" className="hover:text-primary transition-colors">Testimonios Reales</Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-primary transition-colors font-medium text-white">Portal de Cliente</Link>
              </li>
            </ul>
          </div>

          {/* Síguenos */}
          <div>
            <h4 className="font-medium mb-3 text-sm text-slate-200">Síguenos</h4>
            <ul className="text-gray-400 space-y-4 text-sm">
              <li>
                <a href="https://www.facebook.com/udreamms/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Image src="/assets/f.jpg" alt="Facebook" width={32} height={32} style={{ height: 'auto' }} className="rounded-md" /></a>
              </li>
              <li>
                <a href="https://www.instagram.com/udreamms/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Image src="/assets/i.jpg" alt="Instagram" width={32} height={32} style={{ height: 'auto' }} className="rounded-md" /></a>
              </li>
              <li>
                <a href="https://wa.me/16507840581" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Image src="/assets/w.jpg" alt="kamban" width={32} height={32} style={{ height: 'auto' }} className="rounded-md" /></a>
              </li>
              <li>
                <a href="https://x.com/udreamms" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Image src="/assets/x.jpg" alt="X" width={32} height={32} style={{ height: 'auto' }} className="rounded-md" /></a>
              </li>
              <li>
                <a href="https://www.youtube.com/@udreamms" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Image src="/assets/y.jpg" alt="YouTube" width={32} height={32} style={{ height: 'auto' }} className="rounded-md" /></a>
              </li>
              <li>
                <a href="https://www.tiktok.com/@udreamms" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Image src="/assets/t.jpg" alt="TikTok" width={32} height={32} style={{ height: 'auto' }} className="rounded-md" /></a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="items-center flex mt-20 flex-col md:flex-row gap-4">
          <Link href="/" className="text-white text-lg font-medium hover:text-primary transition-colors tracking-tight">Udreamms</Link>
          <div className="flex justify-center space-x-6 w-full flex-wrap">
            <Link href="/about" className="text-gray-400 hover:text-primary transition-colors text-xs">Acerca de Udreamms</Link>
            <Link href="/visas/student" className="text-gray-400 hover:text-primary transition-colors text-xs">Visa Estudiante</Link>
            <Link href="/visas/tourist" className="text-gray-400 hover:text-primary transition-colors text-xs">Visa Turismo</Link>
            <Link href="/privacidad" className="text-gray-400 hover:text-primary transition-colors text-xs">Privacidad</Link>
            <Link href="/terminos" className="text-gray-400 hover:text-primary transition-colors text-xs">Términos</Link>
          </div>
          <div className="text-gray-600 text-[10px] w-full text-center md:text-right">
            © {new Date().getFullYear()} Udreamms LLC. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
