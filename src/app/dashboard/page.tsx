"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Settings,
  LogOut,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  ExternalLink,
  ChevronDown
} from "lucide-react";

type ConnectionStatus = "connected" | "error" | "syncing" | "pending";

interface Connection {
  id: string;
  provider: string;
  logo: string;
  email: string;
  status: ConnectionStatus;
  lastSync: string;
  invoiceCount: number;
  totalAmount: string;
}

interface Invoice {
  id: string;
  provider: string;
  logo: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "overdue";
  pdfUrl: string;
}

const connections: Connection[] = [
  {
    id: "1",
    provider: "Orange",
    logo: "/logos/orange.png",
    email: "contact@monentreprise.fr",
    status: "connected",
    lastSync: "Il y a 2 heures",
    invoiceCount: 24,
    totalAmount: "1 247,50 €"
  },
  {
    id: "2",
    provider: "Free",
    logo: "/logos/free.png",
    email: "paul@gmail.com",
    status: "connected",
    lastSync: "Il y a 5 heures",
    invoiceCount: 18,
    totalAmount: "359,82 €"
  },
  {
    id: "3",
    provider: "AWS",
    logo: "/logos/aws.png",
    email: "admin@startup.io",
    status: "syncing",
    lastSync: "En cours...",
    invoiceCount: 156,
    totalAmount: "12 458,90 €"
  },
  {
    id: "4",
    provider: "OVH",
    logo: "/logos/ovh.png",
    email: "tech@monsite.com",
    status: "error",
    lastSync: "Erreur de connexion",
    invoiceCount: 8,
    totalAmount: "234,00 €"
  },
  {
    id: "5",
    provider: "EDF",
    logo: "/logos/edf.png",
    email: "bureau@entreprise.fr",
    status: "connected",
    lastSync: "Hier",
    invoiceCount: 12,
    totalAmount: "2 890,45 €"
  }
];

const recentInvoices: Invoice[] = [
  {
    id: "inv-001",
    provider: "Orange",
    logo: "/logos/orange.png",
    date: "28 Nov 2024",
    amount: "49,99 €",
    status: "paid",
    pdfUrl: "#"
  },
  {
    id: "inv-002",
    provider: "AWS",
    logo: "/logos/aws.png",
    date: "25 Nov 2024",
    amount: "847,23 €",
    status: "pending",
    pdfUrl: "#"
  },
  {
    id: "inv-003",
    provider: "Free",
    logo: "/logos/free.png",
    date: "22 Nov 2024",
    amount: "19,99 €",
    status: "paid",
    pdfUrl: "#"
  },
  {
    id: "inv-004",
    provider: "EDF",
    logo: "/logos/edf.png",
    date: "20 Nov 2024",
    amount: "156,78 €",
    status: "paid",
    pdfUrl: "#"
  },
  {
    id: "inv-005",
    provider: "OVH",
    logo: "/logos/ovh.png",
    date: "15 Nov 2024",
    amount: "29,00 €",
    status: "overdue",
    pdfUrl: "#"
  }
];

const availableProviders = [
  { name: "Google Cloud", logo: "/logos/google-cloud.svg" },
  { name: "Bouygues", logo: "/logos/bouygues.png" },
  { name: "SFR", logo: "/logos/sfr.png" },
  { name: "Engie", logo: "/logos/engie.png" },
  { name: "Digital Ocean", logo: "/logos/digitalocean.png" },
];

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    connected: { icon: CheckCircle, text: "Connecté", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    error: { icon: AlertCircle, text: "Erreur", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    syncing: { icon: RefreshCw, text: "Sync...", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    pending: { icon: Clock, text: "En attente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" }
  };

  const { icon: Icon, text, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className={`w-3.5 h-3.5 ${status === "syncing" ? "animate-spin" : ""}`} />
      {text}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: "paid" | "pending" | "overdue" }) {
  const config = {
    paid: { text: "Payée", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    pending: { text: "En attente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    overdue: { text: "En retard", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
  };

  const { text, className } = config[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {text}
    </span>
  );
}

export default function Dashboard() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"connections" | "invoices">("connections");
  const [soshLogin, setSoshLogin] = useState("");
  const [soshPassword, setSoshPassword] = useState("");
  const [soshContractId, setSoshContractId] = useState("");
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCreds = async () => {
      try {
        const res = await fetch("/api/sosh/credentials");
        const data = await res.json();
        if (data?.credentials) {
          setSoshLogin(data.credentials.login || "");
          setSoshContractId(data.credentials.contractId || "");
        }
      } catch (error) {
        console.error("Failed to load credentials", error);
      }
    };
    loadCreds();
  }, []);

  const saveCredentials = async () => {
    setIsSavingCreds(true);
    setCrawlMessage(null);
    try {
      const res = await fetch("/api/sosh/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: soshLogin,
          password: soshPassword,
          contractId: soshContractId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Impossible d'enregistrer");
      }
      setCrawlMessage("Identifiants enregistrés.");
      setSoshPassword("");
    } catch (error: any) {
      setCrawlMessage(error?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSavingCreds(false);
    }
  };

  const triggerCrawl = async () => {
    setIsCrawling(true);
    setCrawlMessage(null);
    try {
      const res = await fetch("/api/sosh/crawl", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Échec du crawl");
      }
      setCrawlMessage(
        `Sync terminée : ${data.saved} facture(s) sauvées sur ${data.invoicesFound || data.saved}.`
      );
    } catch (error: any) {
      setCrawlMessage(error?.message || "Échec du crawl");
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 hidden lg:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Billflow</span>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab("connections")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              activeTab === "connections"
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-secondary"
            }`}
          >
            <RefreshCw className="w-5 h-5" />
            Connexions
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              activeTab === "invoices"
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-secondary"
            }`}
          >
            <FileText className="w-5 h-5" />
            Factures
          </button>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:bg-secondary transition-colors">
            <Download className="w-5 h-5" />
            Exports
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:bg-secondary transition-colors">
            <Settings className="w-5 h-5" />
            Paramètres
          </a>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-secondary rounded-xl p-4 mb-4">
            <p className="text-sm font-medium mb-1">Plan Gratuit</p>
            <p className="text-xs text-muted mb-3">3/5 fournisseurs utilisés</p>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
            </div>
            <a href="#" className="text-xs text-primary mt-2 inline-block hover:underline">
              Passer à Pro
            </a>
          </div>

          <Link href="/" className="flex items-center gap-2 text-muted hover:text-foreground transition-colors text-sm">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {activeTab === "connections" ? "Mes connexions" : "Mes factures"}
            </h1>
            <p className="text-muted">
              {activeTab === "connections"
                ? "Gérez vos fournisseurs connectés"
                : "Consultez et exportez vos factures"}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un fournisseur
          </button>
        </header>

        {/* Sosh/Orange credentials & sync */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <p className="font-semibold">Connexion Sosh/Orange</p>
              <p className="text-sm text-muted">
                Sauvegarde des identifiants en base Postgres, puis crawl Playwright pour récupérer les
                factures.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveCredentials}
                disabled={isSavingCreds}
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-border border border-border text-sm font-medium disabled:opacity-60"
              >
                {isSavingCreds ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={triggerCrawl}
                disabled={isCrawling}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
              >
                {isCrawling ? "Sync en cours..." : "Lancer la sync"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted">Identifiant (email/numéro)</label>
              <input
                value={soshLogin}
                onChange={(e) => setSoshLogin(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="ex: 0601020304 ou email"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted">Mot de passe</label>
              <input
                type="password"
                value={soshPassword}
                onChange={(e) => setSoshPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Mot de passe Orange/Sosh"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted">ID contrat (facturation)</label>
              <input
                value={soshContractId}
                onChange={(e) => setSoshContractId(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="ex: 9082365680"
              />
            </div>
          </div>
          {crawlMessage && (
            <p className="mt-3 text-sm text-muted">
              {crawlMessage}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Fournisseurs", value: "5", icon: RefreshCw },
            { label: "Factures", value: "218", icon: FileText },
            { label: "Total 2024", value: "17 190 €", icon: Download },
            { label: "Ce mois", value: "1 103 €", icon: Clock }
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-muted" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {activeTab === "connections" ? (
          /* Connections List */
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Fournisseurs connectés</h2>
              <button className="text-sm text-primary hover:underline flex items-center gap-1">
                <RefreshCw className="w-4 h-4" />
                Tout synchroniser
              </button>
            </div>

            <div className="divide-y divide-border">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="p-4 hover:bg-card-hover transition-colors flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-white rounded-xl border border-border flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={connection.logo}
                      alt={connection.provider}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{connection.provider}</h3>
                      <StatusBadge status={connection.status} />
                    </div>
                    <p className="text-sm text-muted truncate">{connection.email}</p>
                  </div>

                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium">{connection.invoiceCount} factures</p>
                    <p className="text-xs text-muted">{connection.totalAmount}</p>
                  </div>

                  <div className="hidden md:block text-right">
                    <p className="text-xs text-muted">{connection.lastSync}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Synchroniser">
                      <RefreshCw className="w-4 h-4 text-muted" />
                    </button>
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Plus d'options">
                      <MoreVertical className="w-4 h-4 text-muted" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Invoices List */
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="font-semibold">Toutes les factures</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button className="p-2 bg-secondary border border-border rounded-lg hover:bg-border transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="p-2 bg-secondary border border-border rounded-lg hover:bg-border transition-colors flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Fournisseur</th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Montant</th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Statut</th>
                    <th className="text-right text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-card-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg border border-border flex items-center justify-center p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={invoice.logo}
                              alt={invoice.provider}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <span className="font-medium">{invoice.provider}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{invoice.date}</td>
                      <td className="px-4 py-3 font-medium">{invoice.amount}</td>
                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Télécharger">
                            <Download className="w-4 h-4 text-muted" />
                          </button>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Ouvrir">
                            <ExternalLink className="w-4 h-4 text-muted" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted">Affichage de 5 sur 218 factures</p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm bg-secondary border border-border rounded-lg hover:bg-border transition-colors">
                  Précédent
                </button>
                <button className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ajouter un fournisseur</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Rechercher un fournisseur..."
                  className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {availableProviders.map((provider) => (
                  <button
                    key={provider.name}
                    className="flex items-center gap-3 p-4 bg-secondary hover:bg-border rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg border border-border flex items-center justify-center p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className="font-medium text-sm">{provider.name}</span>
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-muted mt-6">
                Votre fournisseur n&apos;est pas listé ?{" "}
                <a href="#" className="text-primary hover:underline">
                  Demandez-le
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
