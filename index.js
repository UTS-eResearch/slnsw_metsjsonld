const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');


// These constants need to be hooked up to your API
const fileName = 'b1385';
const bookName = 'Scannedpages';
const bookJSONLD = 'ro-crate-metadata.jsonld';
const name  = "Book title";
const description = "Description";
const datePublished = "2019-01-01";

const fileLocation = path.join(process.cwd(), fileName + '.xml');
const roCrateTemplate = fs.readJsonSync(path.join(process.cwd(), 'template', 'ro-crate-metadata.jsonld'));

const hasPart = [];
let jsonLD = {};

const parser = new xml2js.Parser();
fs.readFile(fileLocation, function (err, data) {
  parser.parseString(data, function (err, mets) {
    const amets = mets['mets:mets'];
    const files = amets['mets:structMap'];

    jsonLD = roCrateTemplate;
    // Find the root dataset
    // First find the item that is the root dataset
    var rootDatasetDescriptor = jsonLD["@graph"].filter((d) => {if (d["@id"]==["ro-crate-metadata.jsonld"]) {return d} })[0];
    // Then find the rootDataset that it is about.
    console.log("desc", rootDatasetDescriptor);
    const rootDataset = jsonLD["@graph"].filter((r) => {if (r["@id"] ==  rootDatasetDescriptor.about["@id"]){ return r}})[0];

    rootDataset.name = name;
    rootDataset.description = description;
    rootDataset.datePublished = datePublished;

    files.map((file, index) => {
      const image = file['mets:div'][0];
      const imageObjects = image['mets:fptr'];
      const iOs = imageObjects.map(fO => fO['$']['FILEID']);
      const screen = iOs[0] || null;
      const alto = iOs[1] || null;
      let name = '';

      //Get the name of the page
      if (screen) {
        const parts = screen.split('.');
        name = parts[0];
        hasPart.push({'@id': name});
      }

      if (screen) {
        const fileId = 'SCREEN/' + screen;

        const screenObj = {
          '@id': screen,
          'name': 'Page ' + (index + 1) + ' image ',
          '@type': 'File',
          'path': fileId
        };

        jsonLD['@graph'].push(screenObj);
      }

      if (alto) {
        const fileId = 'ALTO/' + alto;
        const altonObj = {
          '@id': alto,
          'name': 'Page ' + (index + 1) + ' xml ',
          '@type': 'File',
          'path': fileId
        };
        jsonLD['@graph'].push(altonObj);

      }

      const hasPartPage = [];

      if (screen) {
        hasPartPage.push({'@id': screen})
      }
      if (alto) {
        hasPartPage.push({'@id': alto})
      }
      const pageObj = {
        '@id': name,
        'name': 'Page ' + (index + 1),
        '@type': 'RepositoryObject',
        'hasPart': hasPartPage
      };

      jsonLD['@graph'].push(pageObj);

    });
    
    const book = {
      '@id': '_:book',
      'name': bookName,
      '@type': ['Dataset'],
      'hasPart': hasPart
    };
    rootDataset.hasPart = [
      {
        '@id': '_:book'
      }
    ];
    
    // TODO if there are epub and PDF versions of the book add them too, as per
    // This example: https://data.research.uts.edu.au/examples/ro-crate/examples/src/samples/IE4783007/ro-crate-metadata.jsonld


    jsonLD['@graph'].push(book);

    let data = JSON.stringify(jsonLD, null, 2);

    fs.writeFileSync(bookJSONLD, data, {mode: 0o755});
    
    console.log(`done writing book jsonld : ${bookJSONLD}`);
  });

});