"use client";

import Link from "next/link";
import {
  Zap,
  Shield,
  Clock,
  FileText,
  ChevronRight,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const providers = [
  { name: "Orange", logo: "/logos/orange.png", color: "#ff7900" },
  { name: "Free", logo: "/logos/free.png", color: "#cd1e25" },
  { name: "AWS", logo: "/logos/aws.png", color: "#ff9900" },
  { name: "OVH", logo: "/logos/ovh.png", color: "#000e9c" },
  { name: "Google Cloud", logo: "/logos/google-cloud.svg", color: "#4285f4" },
  { name: "Bouygues", logo: "/logos/bouygues.png", color: "#009ddc" },
  { name: "SFR", logo: "/logos/sfr.png", color: "#e2001a" },
  { name: "EDF", logo: "/logos/edf.png", color: "#ff5f00" },
  { name: "Engie", logo: "/logos/engie.png", color: "#00aaff" },
];

const features = [
  {
    icon: Zap,
    title: "Synchronisation automatique",
    description: "Vos factures sont récupérées automatiquement chaque mois, sans aucune action de votre part."
  },
  {
    icon: Shield,
    title: "Sécurisé & chiffré",
    description: "Vos identifiants sont chiffrés et jamais stockés en clair. Connexion sécurisée avec chaque fournisseur."
  },
  {
    icon: Clock,
    title: "Historique complet",
    description: "Accédez à tout l'historique de vos factures, organisé et consultable à tout moment."
  },
  {
    icon: FileText,
    title: "Export facile",
    description: "Exportez vos factures en PDF, CSV ou envoyez-les directement à votre comptable."
  }
];

const testimonials = [
  {
    name: "Marie L.",
    role: "Freelance Designer",
    content: "Billflow me fait gagner 2h par mois. Plus besoin de me connecter à 10 sites différents !",
    avatar: "ML"
  },
  {
    name: "Thomas B.",
    role: "CEO, StartupFlow",
    content: "La compta n'a jamais été aussi simple. Toutes mes factures SaaS au même endroit.",
    avatar: "TB"
  },
  {
    name: "Sophie R.",
    role: "Comptable",
    content: "Mes clients m'envoient leur export Billflow. C'est un gain de temps énorme.",
    avatar: "SR"
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Billflow</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted hover:text-foreground transition-colors">Fonctionnalités</a>
              <a href="#providers" className="text-muted hover:text-foreground transition-colors">Fournisseurs</a>
              <a href="#pricing" className="text-muted hover:text-foreground transition-colors">Tarifs</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
                Connexion
              </Link>
              <Link
                href="/dashboard"
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Démarrer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Nouveau : Support AWS et Google Cloud</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Toutes vos factures,
            <br />
            <span className="gradient-text">un seul endroit</span>
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Billflow synchronise automatiquement vos factures depuis Orange, Free, AWS,
            OVH et plus de 50 autres fournisseurs. Fini la chasse aux factures.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 animate-pulse-glow"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-border text-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Voir la démo
            </a>
          </div>

          <p className="text-sm text-muted mt-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <CheckCircle className="w-4 h-4 inline mr-1 text-accent" />
            Gratuit jusqu&apos;à 5 fournisseurs • Pas de carte bancaire requise
          </p>
        </div>
      </section>

      {/* Providers Carousel */}
      <section id="providers" className="py-16 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-muted mb-8">Synchronisez vos factures depuis</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {providers.map((provider, index) => (
              <div
                key={provider.name}
                className="flex items-center justify-center w-24 h-16 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={provider.logo}
                  alt={provider.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ))}
          </div>
          <p className="text-center text-muted mt-8 text-sm">
            Et plus de 50 autres fournisseurs...
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Pourquoi Billflow ?</h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Simplifiez votre gestion de factures avec des fonctionnalités pensées pour vous
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-xl text-muted">3 étapes simples pour centraliser vos factures</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Connectez vos comptes", description: "Ajoutez vos fournisseurs en quelques clics avec vos identifiants habituels" },
              { step: "2", title: "Sync automatique", description: "Billflow récupère automatiquement toutes vos factures, passées et futures" },
              { step: "3", title: "Gérez & exportez", description: "Consultez, triez et exportez vos factures où vous voulez" }
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted">{item.description}</p>
                </div>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-8 text-muted" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Ils nous font confiance</h2>
            <p className="text-xl text-muted">Plus de 10 000 utilisateurs gèrent leurs factures avec Billflow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <p className="text-lg mb-6">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tarifs simples</h2>
            <p className="text-xl text-muted">Commencez gratuitement, évoluez selon vos besoins</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Gratuit",
                price: "0€",
                description: "Pour les particuliers",
                features: ["5 fournisseurs max", "Sync mensuelle", "Export PDF", "Support email"],
                cta: "Commencer",
                popular: false
              },
              {
                name: "Pro",
                price: "9€",
                period: "/mois",
                description: "Pour les freelances",
                features: ["Fournisseurs illimités", "Sync quotidienne", "Export CSV & PDF", "API access", "Support prioritaire"],
                cta: "Essai gratuit 14j",
                popular: true
              },
              {
                name: "Business",
                price: "29€",
                period: "/mois",
                description: "Pour les équipes",
                features: ["Tout de Pro", "Multi-utilisateurs", "Intégrations compta", "SSO", "Support dédié"],
                cta: "Contacter",
                popular: false
              }
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-card border rounded-2xl p-8 relative ${
                  plan.popular ? "border-primary shadow-lg scale-105" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Populaire
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-muted mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted">{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                    plan.popular
                      ? "bg-primary hover:bg-primary-dark text-white"
                      : "bg-secondary hover:bg-border text-foreground"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="gradient-hero rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">Prêt à simplifier vos factures ?</h2>
            <p className="text-xl opacity-90 mb-8">
              Rejoignez des milliers d&apos;utilisateurs qui ont dit adieu au chaos des factures
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-opacity-90 transition-colors"
            >
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Billflow</span>
              </div>
              <p className="text-muted">
                La solution simple pour centraliser toutes vos factures.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-muted">
                <li><a href="#" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2 text-muted">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-muted">
                <li><a href="#" className="hover:text-foreground transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">CGU</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-muted">
            <p>© 2024 Billflow. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
