# AriarySwap

Application web d'échange Ariary ⇄ Cryptomonnaie (React + Vite + Supabase).

## 1. Installer et lancer en local

```bash
npm install
npm run dev
```
L'app tourne sur http://localhost:5173 — la clé Supabase est déjà dans `.env`.

## 2. Configurer la base de données

Dans le tableau de bord Supabase → **SQL Editor**, colle le contenu de
`supabase/schema.sql` et exécute-le. Cela crée :
- `profiles`, `wallets`, `phone_operators`, `exchange_rates`, `orders`, `notifications`
- Les policies de sécurité (Row Level Security) : chaque client ne voit que ses propres
  données, l'admin voit tout.
- Un trigger qui crée automatiquement un profil `client` à chaque inscription.

## 3. Créer les buckets de stockage

Dans **Storage**, crée deux buckets **privés** :
- `wallet-scans` (photos des adresses crypto scannées)
- `kyc-documents` (si tu ajoutes des pièces d'identité plus tard)

Puis dans **Storage → Policies**, ajoute une policy permettant à chaque
utilisateur de lire/écrire uniquement dans son propre dossier (`auth.uid()`
en préfixe du chemin, ce que fait déjà le code : `${profile.id}/...`).

## 4. Créer ton premier compte admin

1. Inscris-toi normalement dans l'app (un profil `role = 'client'` est créé automatiquement).
2. Dans **Table Editor → profiles**, change manuellement `role` à `admin` pour ton compte.
3. Reconnecte-toi : le lien "Admin" apparaît dans la barre latérale.

## 5. Connexion Google (optionnel)

Dans **Authentication → Providers → Google**, active le provider et renseigne
tes identifiants OAuth Google Cloud. Le bouton "Continuer avec Google" est déjà
câblé côté code.

## 6. Déployer

Le plus simple : connecte ce dossier à **Vercel** ou **Netlify**, ajoute les
variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
dans les réglages du projet, et déploie.

## Structure

```
src/
  lib/supabaseClient.js     → connexion Supabase
  context/AuthContext.jsx   → session + profil utilisateur (rôle, KYC)
  components/               → Sidebar, Topbar, ProtectedRoute
  pages/
    Login.jsx               → connexion / inscription / mot de passe oublié
    Dashboard.jsx           → accueil, taux du marché
    Exchange.jsx            → passer un ordre d'achat/vente
    Orders.jsx              → historique des ordres du client
    Wallet.jsx              → KYC + wallets crypto + numéros mobiles
    Admin.jsx               → stats, taux, validation KYC/ordres, notifications
supabase/schema.sql          → tables + sécurité (RLS) à exécuter dans Supabase
```
