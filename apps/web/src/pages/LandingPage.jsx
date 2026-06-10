import React from "react";
import { Link } from "react-router-dom";
import {
  Table2,
  Network,
  Filter,
  SlidersHorizontal,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { APP_ROUTES } from "../constants/appConstants";
import useAuthStore from "../store/useAuthStore";

const CURRENT_YEAR = new Date().getFullYear();

const features = [
  {
    id: "table",
    title: "Tabela decyzyjna (Smart Choices)",
    desc: "Porównuj opcje według wielu kryteriów. Nadaj im wagi i zobacz, która wygrywa w rankingu.",
    Icon: Table2,
    wrapperClass: "md:col-span-2",
  },
  {
    id: "tree",
    title: "Drzewo decyzyjne",
    desc: "Rozpisz scenariusze i ich prawdopodobieństwa. System pokaże najlepszą decyzję na podstawie wartości oczekiwanej (EV).",
    Icon: Network,
    wrapperClass: "md:row-span-2",
    iconContainerClass: "mb-auto mt-2",
  },
  {
    id: "pareto",
    title: "Filtrowanie dominacji (Pareto)",
    desc: "Automatycznie usuwa opcje, które są wyraźnie gorsze. Zostają tylko te, które warto rozważyć.",
    Icon: Filter,
  },
  {
    id: "whatif",
    title: "Symulacje (What-if)",
    desc: "Zmieniaj wagi oraz prawdopodobieństwa, aby od razu zobaczysz wpływ na wynik bez potrzeby ręcznego przeliczania.",
    Icon: SlidersHorizontal,
  },
  {
    id: "sharing",
    title: "Udostępnianie i chmura",
    desc: "Zapisuj decyzje na swoim koncie i generuj publiczne linki Read-Only, aby skonsultować wybór z zespołem.",
    Icon: Share2,
  },
  {
    id: "backend",
    title: "Silnik analizy decyzji",
    desc: "Złożone obliczenia i rankingi są weryfikowane po stronie backendu, co zwiększa spójność wyników i chroni projekt przed konfliktami równoległego zapisu.",
    Icon: ShieldCheck,
    wrapperClass: "md:col-span-2",
  },
];

const steps = [
  {
    num: 1,
    title: "Zbuduj model problemu",
    desc: "Wybierz tabelę, gdy masz konkretne opcje do porównania (np. oferty pracy: pensja, dojazd), lub zdecyduj się na drzewo, jeśli Twoja decyzja zawiera ryzyko i niepewność.",
    colorStyle:
      "border-purple-500 !text-purple-400 shadow-[0_0_10px_rgba(139,92,246,0.4)]",
  },
  {
    num: 2,
    title: "Wprowadź dane",
    desc: 'Liczby, procenty, własne oceny tekstowe (np. "wysoki standard" → 3 pkt), prawdopodobieństwa — narzędzie dopasuje się do Twoich danych.',
    colorStyle:
      "border-cyan-500 !text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]",
  },
  {
    num: 3,
    title: "Automatyczna analiza",
    desc: "Algorytm analizuje dane i eliminuje opcje zdominowane (gorsze we wszystkich kryteriach), redukując przestrzeń decyzji. W drzewie obliczana jest wartość oczekiwana każdej ścieżki, co zwalnia Cię z ręcznych kalkulacji.",
    colorStyle: "border-white/50 !text-white/70",
  },
  {
    num: 4,
    title: "Kompromisy i wybór",
    desc: "Dokonuj świadomych kompromisów między celami w tabeli lub symuluj scenariusze what-if na drzewie, aż pozostanie jedna, najlepsza decyzja oparta na twardych danych.",
    colorStyle:
      "border-emerald-500 !text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
  },
];

export default function LandingPage() {
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-[#030303] !text-white font-sans selection:bg-purple-500/30 overflow-hidden">
      <header className="fixed top-0 left-1/2 -translate-x-1/2 mt-6 z-50 w-max max-w-[90vw]">
        <nav className="flex items-center gap-1.5 px-4 py-2 border border-white/5 bg-black/60 backdrop-blur-md rounded-full shadow-[0_0_20px_-10px_rgba(139,92,246,0.3)]">
          <span className="font-bold text-sm tracking-tight !text-white/90 mr-2 md:mr-4">
            Decidely.
          </span>

          <a
            href="#features"
            className="hidden md:block !text-white/70 text-[12px] font-medium px-2.5 py-1 hover:!text-white transition-colors"
          >
            Cechy
          </a>
          <a
            href="#how-it-works"
            className="hidden md:block !text-white/70 text-[12px] font-medium px-2.5 py-1 hover:!text-white transition-colors"
          >
            Jak to działa?
          </a>
          <a
            href="#cases"
            className="hidden md:block !text-white/70 text-[12px] font-medium px-2.5 py-1 hover:!text-white transition-colors"
          >
            Przykłady
          </a>

          <div className="flex items-center gap-2 ml-2 md:ml-4 border-l border-white/10 pl-2 md:pl-4">
            <a
              href="LINK_DO_TWOJEGO_REPO"
              title="Kod źródłowy na GitHubie"
              target="_blank"
              rel="noopener noreferrer"
              className="!text-white/50 hover:!text-white transition-colors px-2 flex items-center justify-center"
              aria-label="Zobacz kod na GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-[18px] h-[18px] fill-current"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>

            {isAuthenticated ? (
              <Link
                to={APP_ROUTES.TABLE}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 border-none rounded-full bg-emerald-500 !text-white text-[12px] font-semibold cursor-pointer transition-all hover:bg-emerald-600 hover:shadow-[0_0_20px_0_rgba(16,185,129,0.3)]"
              >
                Otwórz aplikację
              </Link>
            ) : (
              <>
                <button
                  onClick={openLoginModal}
                  className="bg-transparent border-none cursor-pointer !text-white/70 text-[12px] font-medium px-2.5 py-1.5 hover:!text-white transition-colors"
                >
                  Zaloguj
                </button>

                <Link
                  to="/app/table?scenario=developerHiring"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-none rounded-full bg-purple-500 !text-white text-[12px] font-semibold cursor-pointer transition-all hover:bg-purple-600 hover:shadow-[0_0_20px_0_rgba(139,92,246,0.2)]"
                >
                  Wypróbuj bez konta
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="pt-40 pb-20 px-6 text-center max-w-[1200px] mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="m-0 text-5xl md:text-7xl font-extrabold tracking-[-2px] md:tracking-[-3.5px] leading-[1.1] md:leading-[1] !text-white"
        >
          Podejmuj decyzje w oparciu <br />o dane, nie przeczucie.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-6 mb-10 max-w-[600px] mx-auto !text-white/70 text-lg leading-relaxed"
        >
          Decidely zamienia niepewność w liczby. Tabela decyzyjna lub drzewo
          scenariuszy — metodologia prosto z Harvard Business School.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row gap-4 justify-center items-center"
        >
          <Link
            to="/app/table?scenario=developerHiring"
            className="px-5 py-2.5 cursor-pointer font-semibold text-sm bg-purple-500 !text-white border-none rounded-md transition-all hover:shadow-[0_0_30px_0_rgba(139,92,246,0.2)] hover:bg-purple-600"
          >
            Porównaj Opcje
          </Link>
          <Link
            to="/app/tree?scenario=basketball"
            className="px-5 py-2.5 cursor-pointer font-semibold text-sm bg-cyan-600 !text-white border-none rounded-md transition-all hover:shadow-[0_0_30px_0_rgba(8,145,178,0.3)] hover:bg-cyan-500"
          >
            Zbuduj Drzewo Decyzji
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          className="relative mt-20 w-full max-w-[1400px] mx-auto z-0"
        >
          <div className="absolute left-[10%] top-[20%] w-[500px] h-[500px] bg-purple-500/40 blur-[120px] rounded-full -z-10"></div>
          <div className="absolute right-[10%] top-[30%] w-[450px] h-[450px] bg-cyan-400/30 blur-[120px] rounded-full -z-10"></div>

          <div className="relative">
            <div className="p-4 bg-white/[0.03] rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              <div className="flex flex-col md:flex-row gap-5 bg-[#0d0d0d] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5">
                <div className="w-full md:flex-1 flex items-center justify-center bg-[#0d0d0d] rounded-xl overflow-hidden relative group">
                  <div className="absolute top-4 left-5 px-3 py-1.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg text-[11px] font-bold text-white/90 uppercase tracking-widest z-10 shadow-lg">
                    Tabela
                  </div>
                  <img
                    src="/table.png"
                    alt="Tabela Decyzyjna - Wielokryterialna analiza"
                    className="w-full h-auto object-contain block"
                    loading="eager"
                  />
                </div>

                <div className="w-full md:flex-1 flex items-center justify-center bg-[#0d0d0d] rounded-xl overflow-hidden relative group">
                  <div className="absolute top-4 left-5 px-3 py-1.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg text-[11px] font-bold text-white/90 uppercase tracking-widest z-10 shadow-lg">
                    Drzewo
                  </div>
                  <img
                    src="/tree.png"
                    alt="Symulacja Drzewa Decyzyjnego"
                    className="w-full h-auto object-contain block"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="py-20 px-6 max-w-[1200px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center m-0 text-4xl font-extrabold tracking-[-1.5px] !text-white"
        >
          Koniec z wyborem na wyczucie.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mt-4 text-sm !text-white/60 max-w-[640px] mx-auto"
        >
          Decidely pomaga podejmować decyzje w oparciu o sprawdzone metody
          analizy: porównywanie wielokryterialne, dominację Pareto, symulacje
          what-if oraz wartość oczekiwaną w drzewach decyzyjnych.
        </motion.p>

       
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[250px] max-w-[1000px] mx-auto">
          {features.map(
            (
              { id, title, desc, Icon, wrapperClass, iconContainerClass },
              i,
            ) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`p-6 xl:p-8 flex flex-col justify-end gap-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors ${wrapperClass || "md:col-span-1"}`}
              >
                <div className={iconContainerClass}>
                  <Icon className="w-6 h-6 !text-white" />
                </div>
                <h3 className="m-0 text-xl font-bold tracking-tight !text-white/90">
                  {title}
                </h3>
                <p className="m-0 text-[14px] !text-white/60 leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ),
          )}
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6 max-w-[1000px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center m-0 text-3xl font-extrabold tracking-[-1px] !text-white"
        >
          Proces decyzyjny w 4 krokach
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mt-4 mb-16 text-sm !text-white/60 max-w-[600px] mx-auto"
        >
          Przekształć chaos informacyjny w czystą, matematyczną odpowiedź.
        </motion.p>

        <div className="relative border-l border-white/10 ml-4 md:ml-12 space-y-12 pb-4">
          {steps.map(({ num, title, desc, colorStyle }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative pl-8 md:pl-12"
            >
              <div
                className={`absolute left-[-16px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#030303] border-2 font-bold text-sm ${colorStyle}`}
              >
                {num}
              </div>
              <h3 className="m-0 text-xl font-bold !text-white/90">{title}</h3>
              <p className="mt-2 text-[14px] !text-white/60 leading-relaxed">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        id="cases"
        className="py-20 px-6 max-w-[1200px] mx-auto text-center"
      >
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="m-0 text-3xl font-bold !text-white/90"
        >
          Gdzie to się sprawdza
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="mt-10 flex flex-wrap gap-3 justify-center"
        >
          {[
            "Zatrudnienie Kandydata",
            "Wybór Frameworka",
            "Planowanie Kariery",
            "Wybór Oferty Pracy",
            "Kupno Samochodu",
          ].map((item) => (
            <motion.div
              key={item}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="px-4 py-1.5 border border-white/10 bg-black rounded-full text-[12px] font-medium !text-white/70 transition-colors hover:!text-white hover:border-white/30"
            >
              {item}
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="py-24 px-6 max-w-[800px] mx-auto text-center">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <h3 className="text-xl font-bold !text-white/90 mb-6">
            Dlaczego zbudowałem Decidely?
          </h3>
          <div className="space-y-4 text-[16px] md:text-lg !text-white/60 leading-relaxed font-light italic">
            <p>
              Większość narzędzi decyzyjnych oferuje tabele albo drzewa, rzadko
              łącząc oba podejścia jednocześnie. Często są to też proste
              kalkulatory, niewygodne w użyciu narzędzia lub systemy oparte na
              przestarzałych technologiach.
            </p>
            <p>
              Zbudowałem Decidely, aby połączyć nowoczesny interfejs z
              formalnymi metodami nauk decyzyjnych i sprawdzić, jak daleko można
              pójść, gdy potraktujemy proces podejmowania decyzji jak realny
              problem inżynierski.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-[1px] w-8 bg-white/10" />
            <span className="text-sm font-semibold tracking-wider uppercase !text-white/40">
              Remigiusz, autor projektu
            </span>
            <div className="h-[1px] w-8 bg-white/10" />
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-[1200px] mx-auto text-center border-t border-white/5 bg-[#010101]">
        <h4 className="m-0 text-xs font-semibold uppercase tracking-[2px] !text-white/40">
          Stack technologiczny
        </h4>
        <div className="mt-10 flex flex-wrap justify-center gap-10 items-center opacity-60">
          {[
            "Java 21",
            "Spring Boot 3",
            "React",
            "Zustand",
            "React Flow",
            "Tailwind CSS",
          ].map((tech) => (
            <span key={tech} className="text-xl !text-white/60 font-medium">
              {tech}
            </span>
          ))}
        </div>
      </section>

      <section className="pb-16 px-6 text-center bg-[#010101]">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="m-0 text-[12px] !text-white/60 font-mono">
            Zawiera{" "}
            <span className="!text-white/90 font-semibold">analizę MCDA</span>,
            obliczenia <span className="!text-white/90 font-semibold">EV</span>{" "}
            w drzewach decyzyjnych oraz{" "}
            <span className="!text-white/90 font-semibold">
              Optimistic Concurrency Control
            </span>
            .
          </p>
        </div>
      </section>
      <footer className="py-10 px-6 text-center text-[11px] !text-white/30 border-t border-white/5">
        © {CURRENT_YEAR} Decidely.
      </footer>
    </div>
  );
}
