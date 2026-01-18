/**
 * Script de peuplement de la base de données
 * Exécuter avec: node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Importer les modèles
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Evaluation = require('../models/Evaluation');
const Notification = require('../models/Notification');
const EmailTemplate = require('../models/EmailTemplate');
const SentEmail = require('../models/SentEmail');
const Document = require('../models/Document');

// On utilise l'URI définie dans le .env (Atlas) ou locale par défaut
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/erp-evaluation';

const seedData = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer les données existantes
    await Promise.all([
      User.deleteMany({}),
      Campaign.deleteMany({}),
      Evaluation.deleteMany({}),
      Notification.deleteMany({}),
      EmailTemplate.deleteMany({}),
      SentEmail.deleteMany({}),
      Document.deleteMany({})
    ]);
    console.log('🗑️  Données existantes supprimées');

    // Créer les utilisateurs RH
    const rh = await User.create({
      fullName: 'Sarah Martin',
      email: 'rh@company.com',
      password: 'password123',
      role: 'rh',
      department: 'Ressources Humaines',
      isActive: true
    });
    console.log('👤 RH créé:', rh.email);

    // Créer un employé avec période d'essai et documents manquants pour le workflow
    const emp1 = await User.create({
      fullName: 'Jean Dupont',
      email: 'jean.dupont@company.com',
      password: 'password123',
      role: 'employee',
      department: 'Informatique',
      trialPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
      trialValidationStatus: 'not_applicable',
      missingDocuments: ['RIB', 'Photo'],
      isActive: true
    });
    console.log('👤 Employé avec période d\'essai créé:', emp1.email);

    // Créer les Managers
    const manager = await User.create({
      fullName: 'Pierre Durand',
      email: 'manager@company.com',
      password: 'password123',
      role: 'manager',
      department: 'Management',
      isActive: true
    });
    console.log('👤 Manager créé:', manager.email);

    // Créer le Directeur
    const directeur = await User.create({
      fullName: 'Marc Lefort',
      email: 'directeur@company.com',
      password: 'password123',
      role: 'directeur',
      department: 'Direction Générale',
      isActive: true
    });
    console.log('👤 Directeur créé:', directeur.email);

    // Créer les Chefs d'équipe
    const chefEquipe1 = await User.create({
      fullName: 'Marie Lefebvre',
      email: 'chef1@company.com',
      password: 'password123',
      role: 'chef_equipe',
      department: 'Développement',
      managerId: manager._id,
      isActive: true
    });

    const chefEquipe2 = await User.create({
      fullName: 'Thomas Bernard',
      email: 'chef2@company.com',
      password: 'password123',
      role: 'chef_equipe',
      department: 'Marketing',
      managerId: manager._id,
      isActive: true
    });
    console.log('👤 Chefs d\'équipe créés');

    // Créer les Employés (avec User.create pour déclencher le hook de hash du mot de passe)
    const employees = [];

    employees.push(emp1);

    employees.push(await User.create({
      fullName: 'Alice Moreau',
      email: 'alice.moreau@company.com',
      password: 'password123',
      role: 'employee',
      department: 'Développement',
      supervisorId: chefEquipe1._id,
      missingDocuments: ['RIB', 'Attestation Mutuelle'],
      isActive: true
    }));

    employees.push(await User.create({
      fullName: 'Lucas Petit',
      email: 'lucas.petit@company.com',
      password: 'password123',
      role: 'employee',
      department: 'Développement',
      supervisorId: chefEquipe1._id,
      missingDocuments: ['Justificatif de domicile'],
      isActive: true
    }));

    employees.push(await User.create({
      fullName: 'Emma Richard',
      email: 'emma.richard@company.com',
      password: 'password123',
      role: 'employee',
      department: 'Marketing',
      supervisorId: chefEquipe2._id,
      isActive: true
    }));

    employees.push(await User.create({
      fullName: 'Hugo Simon',
      email: 'hugo.simon@company.com',
      password: 'password123',
      role: 'employee',
      department: 'Marketing',
      supervisorId: chefEquipe2._id,
      trialPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Ends in 3 days
      trialValidationStatus: 'not_applicable',
      isActive: true
    }));

    const amine = await User.create({
      fullName: 'Amine Ben Smida',
      email: 'aminebensmida46@gmail.com',
      password: 'password123',
      role: 'employee',
      department: 'Développement',
      missingDocuments: ['RIB'],
      isActive: true
    });
    employees.push(amine);
    console.log(`👤 ${employees.length} employés créés`);

    // Créer une campagne active
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7); // Commence il y a 7 jours
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 23); // Termine dans 23 jours

    const campaign = await Campaign.create({
      title: 'Évaluation Annuelle 2024',
      description: 'Campagne d\'évaluation des performances annuelles',
      createdBy: rh._id,
      startDate: startDate,
      endDate: endDate,
      status: 'active',
      launchedAt: new Date(),
      stats: {
        totalEmployees: employees.length,
        evaluationsCompleted: 0,
        validatedByManager: 0,
        validatedByRH: 0
      }
    });
    console.log('📋 Campagne créée:', campaign.title);

    // Créer des évaluations pour chaque employé
    const evaluations = [];
    for (const employee of employees) {
      const evaluation = await Evaluation.create({
        employeeId: employee._id,
        campaignId: campaign._id,
        status: 'pending'
      });
      evaluations.push(evaluation);
    }
    console.log(`📝 ${evaluations.length} évaluations créées`);

    // Créer quelques notifications
    await Notification.insertMany([
      {
        userId: chefEquipe1._id,
        title: 'Nouvelle campagne d\'évaluation',
        message: 'La campagne "Évaluation Annuelle 2024" a été lancée. Vous pouvez commencer les évaluations.',
        read: false
      },
      {
        userId: chefEquipe2._id,
        title: 'Nouvelle campagne d\'évaluation',
        message: 'La campagne "Évaluation Annuelle 2024" a été lancée. Vous pouvez commencer les évaluations.',
        read: false
      },
      {
        userId: manager._id,
        title: 'Campagne lancée',
        message: 'Une nouvelle campagne d\'évaluation est en cours.',
        read: false
      }
    ]);
    console.log('🔔 Notifications créées');

    // Créer des modèles d'e-mails
    await EmailTemplate.create([
      {
        name: 'WELCOME_MAIL',
        subject: 'Bienvenue au sein de notre entreprise !',
        body: 'Bonjour {{fullName}},\n\nNous sommes ravis de vous accueillir dans l\'équipe. Votre compte a été créé avec succès.\n\nCordialement,\nL\'équipe RH',
        description: 'Mail de bienvenue envoyé aux nouveaux employés'
      },
      {
        name: 'DOC_REMINDER',
        subject: 'Documents manquants pour votre dossier',
        body: 'Bonjour {{fullName}},\n\nIl nous manque encore les documents suivants pour compléter votre dossier RH : {{missingDocs}}.\n\nMerci de nous les faire parvenir dès que possible.',
        description: 'Rappel pour les documents administratifs manquants'
      },
      {
        name: 'TRIAL_END',
        subject: 'Évaluation de fin de période d\'essai',
        body: 'Bonjour {{fullName}},\n\nVotre période d\'essai arrive à son terme. Votre manager va procéder à l\'évaluation finale cette semaine.\n\nLe système ERP',
        description: 'Notification automatique de fin de période d\'essai'
      },
      {
        name: 'CONGRATS_MAIL',
        subject: 'Félicitations pour votre titularisation !',
        body: 'Bonjour {{fullName}},\n\nNous avons le plaisir de vous confirmer la validation de votre période d\'essai. Bienvenue officiellement parmi nous !\n\nL\'équipe RH',
        description: 'E-mail envoyé après validation de la période d\'essai'
      }
    ]);
    console.log('📧 Modèles d\'e-mails créés');

    // Créer des documents de test pour la vérification

    console.log('📁 Documents de test créés');

    console.log('\n========================================');
    console.log('✅ Base de données peuplée avec succès !');
    console.log('========================================\n');
    console.log('Comptes de test créés:');
    console.log('───────────────────────');
    console.log('RH:           rh@company.com / password123');
    console.log('Directeur:    directeur@company.com / password123');
    console.log('Manager:      manager@company.com / password123');
    console.log('Chef équipe:  chef1@company.com / password123');
    console.log('              chef2@company.com / password123');
    console.log('Employé:      jean.dupont@company.com / password123');
    console.log('              alice.moreau@company.com / password123');
    console.log('───────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

seedData();

