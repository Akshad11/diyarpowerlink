import mongoose from 'mongoose';

const TitleDescSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const StepSchema = new mongoose.Schema(
  {
    step: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const FaqSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    answer: { type: String, default: '' }
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema(
  {
    websiteName: { type: String, default: 'Diyar Power Link LLP' },
    logo: { type: String, default: '' },
    companyGst: { type: String, default: '' },
    companyTaxNo: { type: String, default: '' },
    footerText: { type: String, default: '' },
    footerDivisions: { type: [String], default: [] },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' }
    },
    socialVisibility: {
      facebook: { type: Boolean, default: true },
      instagram: { type: Boolean, default: true },
      linkedin: { type: Boolean, default: true },
      twitter: { type: Boolean, default: true }
    },
    heroTitle: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' },
    heroDescription: { type: String, default: '' },
    contactAddress: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    businessHours: { type: String, default: '' },
    contactRecipient: { type: String, default: '' },
    home: {
      heroBackgroundImage: { type: String, default: '' },
      heroPrimaryLabel: { type: String, default: '' },
      heroPrimaryLink: { type: String, default: '' },
      heroSecondaryLabel: { type: String, default: '' },
      heroSecondaryLink: { type: String, default: '' },
      heroBadges: { type: [TitleDescSchema], default: [] },
      businessStripItems: { type: [String], default: [] },
      businessAreasTitle: { type: String, default: '' },
      businessAreasSubtitle: { type: String, default: '' },
      businessAreasCtaLabel: { type: String, default: '' },
      servicesTitle: { type: String, default: '' },
      servicesSubtitle: { type: String, default: '' },
      servicesCtaLabel: { type: String, default: '' },
      whoTitle: { type: String, default: '' },
      whoSubtitle: { type: String, default: '' },
      whoDescription: { type: String, default: '' },
      whoBullets: { type: [String], default: [] },
      whoImage: { type: String, default: '' },
      whoStatValue: { type: String, default: '' },
      whoStatLabel: { type: String, default: '' },
      whoCtaLabel: { type: String, default: '' },
      whoCtaLink: { type: String, default: '' },
      productsPreviewTitle: { type: String, default: '' },
      productsPreviewSubtitle: { type: String, default: '' },
      productsPreviewCtaLabel: { type: String, default: '' },
      productsPreviewCtaLink: { type: String, default: '' },
      whyTitle: { type: String, default: '' },
      whySubtitle: { type: String, default: '' },
      whyItems: { type: [TitleDescSchema], default: [] },
      partnersTitle: { type: String, default: '' },
      partnersSubtitle: { type: String, default: '' }
    },
    about: {
      heroTitle: { type: String, default: '' },
      heroSubtitle: { type: String, default: '' },
      heroImage: { type: String, default: '' },
      image: { type: String, default: '' },
      overviewTitle: { type: String, default: '' },
      overviewText: { type: String, default: '' },
      whoTitle: { type: String, default: '' },
      whoText: { type: String, default: '' },
      visionText: { type: String, default: '' },
      missionText: { type: String, default: '' },
      philosophyText: { type: String, default: '' },
      strengths: { type: [TitleDescSchema], default: [] },
      leadership: {
        type: [
          new mongoose.Schema(
            { name: { type: String, default: '' }, role: { type: String, default: '' } },
            { _id: false }
          )
        ],
        default: []
      },
      values: { type: [TitleDescSchema], default: [] }
    },
    servicesPage: {
      heroTitle: { type: String, default: '' },
      heroSubtitle: { type: String, default: '' },
      introTitle: { type: String, default: '' },
      introSubtitle: { type: String, default: '' },
      detailTitle: { type: String, default: '' },
      detailSubtitle: { type: String, default: '' },
      detailDescription: { type: String, default: '' },
      detailItems: { type: [TitleDescSchema], default: [] },
      processTitle: { type: String, default: '' },
      processSubtitle: { type: String, default: '' },
      processSteps: { type: [StepSchema], default: [] },
      enterpriseTitle: { type: String, default: '' },
      enterpriseDescription: { type: String, default: '' },
      enterpriseItems: { type: [String], default: [] }
    },
    contactPage: {
      heroTitle: { type: String, default: '' },
      heroSubtitle: { type: String, default: '' },
      faqTitle: { type: String, default: '' },
      faqSubtitle: { type: String, default: '' },
      faqs: { type: [FaqSchema], default: [] },
      infoTitle: { type: String, default: '' },
      formTitle: { type: String, default: '' },
      mapLabel: { type: String, default: '' },
      mapSubLabel: { type: String, default: '' }
    },
    productsPage: {
      heroTitle: { type: String, default: '' },
      heroSubtitle: { type: String, default: '' },
      sectionTitle: { type: String, default: '' },
      sectionSubtitle: { type: String, default: '' }
    },
    posBarcodeCategories: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', SettingsSchema);
