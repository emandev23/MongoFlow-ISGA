# 🤖 Intégration de l'IA dans MongoFlow

Ce document explique comment l'IA (Google Gemini) est intégrée dans MongoFlow pour fournir une assistance intelligente aux utilisateurs.

## 📋 Vue d'ensemble

MongoFlow utilise **Google Gemini AI** pour fournir :
- ✅ Assistance contextuelle pour les requêtes MongoDB
- ✅ Détection automatique et correction d'erreurs
- ✅ Génération de code MongoDB prêt à l'emploi
- ✅ Suggestions basées sur le schéma de la base de données

## 🏗️ Architecture de l'intégration

### 1. **Composant Frontend : `AIAssistant.tsx`**

Le composant `AIAssistant` est un chat flottant qui permet aux utilisateurs d'interagir avec l'IA.

**Localisation** : `components/AIAssistant.tsx`

**Fonctionnalités principales** :
- Interface de chat avec historique des messages
- Détection automatique d'erreurs depuis le shell MongoDB
- Extraction de blocs de code depuis les réponses de l'IA
- Insertion/exécution directe du code généré

**Intégration dans l'application** :
```tsx
// app/page.tsx
<AIAssistant
  shellHistory={shellHistory}
  onInsertCode={(code) => {
    // Insère le code dans le shell
  }}
  onExecuteCode={(code) => {
    // Exécute le code directement
  }}
/>
```

**Contexte envoyé à l'IA** :
```typescript
const context = {
  database: selectedDatabase,        // Base de données actuelle
  collection: selectedCollection,    // Collection actuelle
  schema: schema.slice(0, 50),       // Schéma (50 premiers champs)
  sampleDocuments: documents.slice(0, 3),  // 3 documents d'exemple
  recentCommands: shellHistory.slice(-3),   // 3 dernières commandes
  recentError: lastError,            // Dernière erreur détectée
  failedCommand: failedCommand       // Commande qui a échoué
};
```

### 2. **API Route : `/api/ai/chat`**

L'endpoint API qui communique avec Google Gemini.

**Localisation** : `app/api/ai/chat/route.ts`

**Fonctionnement** :

1. **Réception de la requête** :
   ```typescript
   POST /api/ai/chat
   Body: {
     message: "User question",
     context: { database, collection, schema, ... }
   }
   ```

2. **Configuration de l'API Gemini** :
   ```typescript
   const apiKey = process.env.GEMINI_API_KEY;
   const genAI = new GoogleGenerativeAI(apiKey);
   ```

3. **Construction du prompt contextuel** :
   - Prompt système décrivant le rôle de l'IA
   - Contexte de la base de données (schéma, documents d'exemple)
   - Historique des erreurs récentes
   - Instructions pour générer du code exécutable

4. **Tentative avec plusieurs modèles** :
   ```typescript
   const modelsToTry = [
     'gemini-2.5-flash',      // Modèle le plus récent
     'gemini-3-flash',         // Alternative
     'gemini-1.5-flash',       // Fallback
     'gemini-1.5-pro',         // Fallback
   ];
   ```

5. **Retour de la réponse** :
   ```typescript
   return NextResponse.json({ 
     response: text,
     success: true
   });
   ```

### 3. **Détection automatique d'erreurs**

L'IA surveille automatiquement les erreurs dans le shell MongoDB.

**Fonctionnement** :
```typescript
// Dans AIAssistant.tsx
useEffect(() => {
  if (shellHistory.length > 0) {
    const lastCommand = shellHistory[shellHistory.length - 1];
    if (lastCommand.error) {
      // Détecte une nouvelle erreur
      handleAutoHelp(lastCommand.command, lastCommand.error);
    }
  }
}, [shellHistory]);
```

**Processus de correction automatique** :
1. Détection d'une erreur dans le shell
2. Envoi automatique à l'IA avec le contexte
3. L'IA analyse l'erreur et génère une correction
4. Affichage de la correction à l'utilisateur
5. Option d'insérer/exécuter le code corrigé

## 🔧 Configuration requise

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Obtenir une clé API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Créez une nouvelle clé API
4. Copiez la clé dans `.env.local`

## 📦 Dépendances

Le package utilisé pour l'intégration Gemini :

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.x.x"
  }
}
```

Installation :
```bash
npm install @google/generative-ai
```

## 🎯 Fonctionnalités de l'IA

### 1. **Assistance contextuelle**

L'IA comprend le contexte de votre base de données :
- Schéma de la collection actuelle
- Types de champs disponibles
- Documents d'exemple
- Commandes récentes

### 2. **Génération de code**

L'IA génère du code MongoDB prêt à l'emploi :
```javascript
// Exemple de code généré
db.products.find({ category: "Electronics" })
db.products.aggregate([
  { $match: { price: { $gt: 100 } } },
  { $group: { _id: "$category", total: { $sum: "$price" } } }
])
```

### 3. **Correction d'erreurs**

L'IA détecte et corrige automatiquement :
- Erreurs de syntaxe
- Commandes invalides
- Problèmes de formatage
- Erreurs de types

### 4. **Suggestions intelligentes**

Basées sur :
- Le schéma de votre collection
- Les patterns de requêtes courantes
- Les meilleures pratiques MongoDB

## 🔄 Flux de données

```
┌─────────────────┐
│  AIAssistant    │
│  (Frontend)     │
└────────┬────────┘
         │
         │ POST /api/ai/chat
         │ { message, context }
         ▼
┌─────────────────┐
│  /api/ai/chat   │
│  (API Route)    │
└────────┬────────┘
         │
         │ GoogleGenerativeAI
         │ generateContent()
         ▼
┌─────────────────┐
│  Google Gemini  │
│  API            │
└────────┬────────┘
         │
         │ Response
         ▼
┌─────────────────┐
│  AIAssistant    │
│  (Display)      │
└─────────────────┘
```

## 💡 Exemples d'utilisation

### Exemple 1 : Demander une requête

**Utilisateur** : "Trouve tous les produits avec un prix supérieur à 100"

**IA** : Génère le code :
```javascript
db.products.find({ price: { $gt: 100 } })
```

### Exemple 2 : Correction automatique

**Erreur détectée** :
```
SyntaxError: Missing comma in array
```

**IA** : Analyse et propose la correction :
```javascript
// Code corrigé
db.products.insertMany([
  { name: "Product 1", price: 100 },
  { name: "Product 2", price: 200 }
])
```

### Exemple 3 : Requête complexe

**Utilisateur** : "Groupe les produits par catégorie et calcule la somme des prix"

**IA** : Génère un pipeline d'agrégation :
```javascript
db.products.aggregate([
  {
    $group: {
      _id: "$category",
      totalPrice: { $sum: "$price" }
    }
  }
])
```

## 🛠️ Personnalisation

### Modifier le prompt système

Éditez `app/api/ai/chat/route.ts` :

```typescript
let systemPrompt = `You are an intelligent MongoDB AI agent...
  // Ajoutez vos instructions personnalisées ici
`;
```

### Ajouter des modèles

Modifiez la liste des modèles dans `route.ts` :

```typescript
const defaultModels = [
  'gemini-2.5-flash',
  'votre-modele-personnalise',
  // ...
];
```

### Personnaliser le contexte

Modifiez le contexte envoyé dans `AIAssistant.tsx` :

```typescript
const context = {
  // Ajoutez vos propres données de contexte
  customData: yourData,
};
```

## 🔒 Sécurité

- ✅ La clé API est stockée dans les variables d'environnement (jamais dans le code)
- ✅ Les requêtes passent par l'API route Next.js (pas d'exposition côté client)
- ✅ Validation des entrées utilisateur
- ✅ Gestion des erreurs et timeouts

## 📊 Monitoring

L'API route log les informations suivantes :
- Modèles essayés
- Modèle utilisé avec succès
- Erreurs rencontrées
- Temps de réponse

Consultez les logs du serveur pour le debugging.

## 🚀 Améliorations futures possibles

- [ ] Support de plusieurs providers IA (OpenAI, Anthropic, etc.)
- [ ] Cache des réponses fréquentes
- [ ] Historique des conversations persisté
- [ ] Suggestions proactives basées sur les patterns
- [ ] Intégration avec l'éditeur de requêtes visuel
- [ ] Génération automatique de pipelines d'agrégation

## 📚 Ressources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai)
- [MongoDB Query Documentation](https://docs.mongodb.com/manual/query/)

---

**Note** : Cette intégration nécessite une clé API Google Gemini valide. Sans cette clé, l'assistant IA ne fonctionnera pas, mais le reste de l'application continuera de fonctionner normalement.

