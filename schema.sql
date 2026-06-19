import Link from "next/link";
import { NewProjectForm } from "@/components/new-project-form";

export default function NewProjectPage() {
  return (
    <main className="container">
      <div className="topbar">
        <div>
          <Link href="/" className="button-secondary">Retour</Link>
          <div style={{ height: 16 }} />
          <span className="kicker">Creation</span>
          <h1>Nouveau projet</h1>
          <p>Renseigne le brief de base. L'application utilisera ces donnees pour guider l'analyse IA.</p>
        </div>
      </div>
      <div className="card">
        <NewProjectForm />
      </div>
    </main>
  );
}
