const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Contact = require('../models/Contact');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talent-collab';

const contactsData = [
  {
    institutionName: 'ACTINVER',
    titular: 'Aaron Alberto Juarez Pascual',
    titularEmail: 'ajuarezp@actinver.com.mx',
    titularPhone: '5530390495',
    suplente: '',
    suplenteEmail: '',
    suplentePhone: ''
  },
  {
    institutionName: 'AMIB RH',
    titular: 'Ana Rovelo',
    titularEmail: 'arovelo@amib.com.mx',
    titularPhone: '',
    suplente: '',
    suplenteEmail: '',
    suplentePhone: ''
  },
  {
    institutionName: 'BANREGIO',
    titular: 'Jonathan Adrian Mendez Guzman',
    titularEmail: 'jonathan.mendez@banregio.com',
    titularPhone: '',
    suplente: 'Fátima Vanessa Espinosa Quintana',
    suplenteEmail: '',
    suplentePhone: ''
  },
  {
    institutionName: 'BOLSA MEXICANA DE VALORES',
    titular: 'Nancy Vazquez Angoa',
    titularEmail: 'nvazquez@grupobmv.com.mx',
    titularPhone: '',
    suplente: '',
    suplenteEmail: '',
    suplentePhone: ''
  },
  {
    institutionName: 'BURSAMETRICA',
    titular: 'Leslie Soria Arellano',
    titularEmail: 'lsoria@bcbcasadebolsa.com',
    titularPhone: '5591988328',
    suplente: 'Bianca Mercado Ortega',
    suplenteEmail: 'bmercado@bcbcasadebolsa.com',
    suplentePhone: ''
  },
  {
    institutionName: 'CONSUBANCO',
    titular: 'Héctor Mauricio Guzmán López',
    titularEmail: 'hguzman@consubanco.com',
    titularPhone: '5549494244',
    suplente: '',
    suplenteEmail: '',
    suplentePhone: ''
  },
  {
    institutionName: 'EBC (CAMPUS CDMX)',
    titular: 'Moniyshel Olivo',
    titularEmail: 'm.olivo@ebc.edu.mx',
    titularPhone: '5510152735',
    suplente: 'Juan José Revilla',
    suplenteEmail: 'j.revilla001@ebc.edu.mx',
    suplentePhone: '5540703575'
  },
  {
    institutionName: 'EBC (CAMPUS TLALNEPANTLA)',
    titular: 'Michelle Denisse Millares Avila',
    titularEmail: 'md.millares@ebc.edu.mx',
    titularPhone: '55 43 88 65 36',
    suplente: 'Axl Salmeron',
    suplenteEmail: 'aj.salmeron@ebc.edu.mx',
    suplentePhone: '55 74 75 00 22'
  },
  {
    institutionName: 'FINAMEX',
    titular: 'Jesús Rafael Rodríguez Sánchez',
    titularEmail: 'jrodriguez@finamex.com.mx',
    titularPhone: '',
    suplente: '',
    suplenteEmail: '',
    suplentePhone: ''
  },
  {
    institutionName: 'INVEX',
    titular: 'Pendiente',
    titularEmail: '',
    titularPhone: '',
    suplente: 'Alejandra Gutiérrez Ríos',
    suplenteEmail: 'agutierrezr@invex.com',
    suplentePhone: ''
  },
  {
    institutionName: 'MASARI',
    titular: 'Claudia Vertiz Hernández',
    titularEmail: 'claudia.vertiz@masari.mx',
    titularPhone: '',
    suplente: 'Valeria Molina',
    suplenteEmail: 'Valeria.Molina@masari.mx',
    suplentePhone: ''
  },
  {
    institutionName: 'MASARI',
    titular: 'Orquídea Tafoya',
    titularEmail: 'Orquidea.Tafoya@masari.mx',
    titularPhone: '',
    suplente: 'Melissa Donaji Escamilla castro',
    suplenteEmail: 'melissa.escamilla@masari.mx',
    suplentePhone: ''
  },
  {
    institutionName: 'MONEX',
    titular: 'Yuliett Reyes',
    titularEmail: 'yreyesz@monex.com.mx',
    titularPhone: '5631875195',
    suplente: 'Verónica González',
    suplenteEmail: 'vgonzalez@monex.com.mx',
    suplentePhone: ''
  },
  {
    institutionName: 'SURA',
    titular: 'Vania Yoselyn Villegas González',
    titularEmail: 'vania.villegas@suramexico.com',
    titularPhone: '5525696316',
    suplente: 'Karla Elizabeth Cabrera Guzmán',
    suplenteEmail: 'karla.cabrera@suramexico.com',
    suplentePhone: ''
  },
  {
    institutionName: 'SURA',
    titular: 'Atziri Victoria García',
    titularEmail: 'Atziri.Victoria@surainvestments.com',
    titularPhone: '56-14-29-67-97',
    suplente: 'Ana Maria Ramos Torres',
    suplenteEmail: 'Ana.Ramos@surainvestments.com',
    suplentePhone: ''
  },
  {
    institutionName: 'TEC DE MONTERREY (CAMPUS CDMX)',
    titular: 'Gabriela Cruz Valdéz',
    titularEmail: 'cruzgab@tec.mx',
    titularPhone: '',
    suplente: 'Ivana Panich Podvezanec',
    suplenteEmail: 'ivana.panic@tec.mx',
    suplentePhone: ''
  },
  {
    institutionName: 'UNIVERSIDAD ANÁHUAC DEL SUR',
    titular: 'Katia Toxtli Hernández',
    titularEmail: 'katia.toxtli@anahuac.mx',
    titularPhone: '55 3918 5503',
    suplente: 'Daniela Morales',
    suplenteEmail: '',
    suplentePhone: '55 6061 7450'
  },
  {
    institutionName: 'UNIVERSIDAD PANAMERICANA',
    titular: 'Irene Griñán Rivera',
    titularEmail: 'igrinan@up.edu.mx',
    titularPhone: '5529654506',
    suplente: 'Jimena Rojas',
    suplenteEmail: 'isrojas@up.edu.mx',
    suplentePhone: ''
  },
  {
    institutionName: 'VALORES MEXICANOS',
    titular: 'Abigail Victoria',
    titularEmail: 'avictoria@valmex.com.mx',
    titularPhone: '',
    suplente: 'Alejandra Lamas Moreno',
    suplenteEmail: 'alamas@valmex.com.mx',
    suplentePhone: ''
  },
  {
    institutionName: 'VE POR MAS',
    titular: 'Adrián Mirazo Cornejo',
    titularEmail: 'amirazo@vepormas.com',
    titularPhone: '',
    suplente: 'Erika López Díaz',
    suplenteEmail: 'elopezd@vepormas.com',
    suplentePhone: ''
  },
  {
    institutionName: 'VIFARU',
    titular: 'Lucina Del Pozo Gómez',
    titularEmail: 'lucina.delpozo@vifaru.mx',
    titularPhone: '5525703656',
    suplente: '',
    suplenteEmail: '',
    suplentePhone: ''
  },
  {
    institutionName: 'AMIB (COORDINACIÓN)',
    titular: 'Alejandra Rosas Grijalva',
    titularEmail: 'arosas@amib.com.mx',
    titularPhone: '6622041833',
    suplente: 'Diana Paulina Hernández Gutiérrez',
    suplenteEmail: 'dhernandez@amib.com.mx',
    suplentePhone: ''
  },
  {
    institutionName: 'AMIB (COORDINACIÓN)',
    titular: 'Alejandra Rosas Grijalva',
    titularEmail: 'arosas@amib.com.mx',
    titularPhone: '6622041833',
    suplente: 'Rocio Garrido Rojas',
    suplenteEmail: 'rqarrido@amib.com.mx',
    suplentePhone: ''
  }
];

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB.');
    
    // Clear existing contacts
    await Contact.deleteMany({});
    console.log('Cleared existing contacts.');

    // Insert clean contacts
    const formattedContacts = contactsData.map(c => ({
      ...c,
      titular: c.titular || 'Pendiente',
      titularEmail: c.titularEmail || 'N/A',
      titularPhone: c.titularPhone || 'N/A'
    }));

    await Contact.insertMany(formattedContacts);
    console.log(`Inserted ${formattedContacts.length} contacts successfully.`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error connecting to DB or seeding:', err);
    process.exit(1);
  });
