const fs = require('fs');
const xml2js = require('xml2js');

const fileName = 'b1385';
const fileLocation = process.cwd() + '/' + fileName + '.xml';

const hasPart = [];

let jsonLD = {};

const parser = new xml2js.Parser();
fs.readFile(fileLocation, function (err, data) {
  parser.parseString(data, function (err, mets) {
    const amets = mets['mets:mets'];
    const files = amets['mets:structMap'];

    jsonLD = {
      "@context": "https://raw.githubusercontent.com/ResearchObject/ro-crate/master/docs/0.2-DRAFT/context.json",
      "@graph": [
        {
          "@id": "https://dx.doi.org/10.4225/35/555d661071c76",
          "name": "Pioneer Work in the Alps of New Zealand",
          "description": "A record of the ",
          "publisher": {
            "@id": "slnsw"
          },
          "datePublished": "2019-08-02",
          "contactPoint": {
            "@id": "K.Trewin@westernsydney.edu.au"
          },
          "@type": [
            "Dataset",
            "Book"
          ],
          "path": "./",
          "name": "Farms to Freeways Example Dataset",
          "creator": [
            {
              "@id": "author"
            }
          ],
          "hasPart": [
            {
              "@id": "book"
            }
          ]
        },
        {
          "@id": "unwin",
          "name": "T Fisher Unwin",
          "address": "London"
        },

        {
          "@id": "author",
          "@type": "ContactPoint",
          "contactType": "customer service",
          "email": "K.Trewin@westernsydney.edu.au",
          "name": "Contact Katrina Trewin"
        },
        {
          "@id": "slnsw",
          "name": "Western Sydney University",
          "@type": "Organization"
        }
      ]
    };

    files.map(file => {
      const image = file['mets:div'][0];
      const imageObjects = image['mets:fptr'];
      const iOs = imageObjects.map(fO => fO['$']['FILEID']);
      const screen = iOs[0] || null;
      const alto = iOs[1] || null;
      let name = '';
      if (screen) {
        const parts = screen.split(".");
        name = parts[0];

        hasPart.push({'@id': name});
      }
      // if (alto) {
      //   hasPart.push({'@id': alto});
      // }
      if (screen) {
        const fileId = "SCREEN/" + screen;

        const screenObj = {
          "@id": screen,
          "name": screen,
          "@type": "RepositoryObject",
          "hasPart": {'@id': fileId}
        };
        const screenObjFile = {
          "@id": fileId,
          "name": fileId,
          "@type": "File",
          "path" : fileId
        };
        jsonLD['@graph'].push(screenObj);
        jsonLD['@graph'].push(screenObjFile);
      }
      if (alto) {
        const fileId = "ALTO/" + alto;
        const altonObj = {
          "@id": alto,
          "name": alto,
          "@type": "RepositoryObject",
          "hasPart": {'@id': fileId}
        };
        const altonObjFile = {
          "@id": fileId,
          "name": fileId,
          "@type": "File",
          "path": fileId

        };
        jsonLD['@graph'].push(altonObj);
        jsonLD['@graph'].push(altonObjFile);


      }


      const hasPartPage = [];

      if (screen) {
        hasPartPage.push({'@id': screen})
      }
      if (alto) {
        hasPartPage.push({'@id': alto})
      }
      const pageObj = {
        "@id": name,
        "name": name,
        "@type": "RepositoryObject",
        "hasPart": hasPartPage
      };

      jsonLD['@graph'].push(pageObj);

    });

    const book = {
      "@id": "book",
      "name": "Pioneer Work in the Alps of New Zealand",
      "@type": "book",
      "hasPart": hasPart
    };

    jsonLD['@graph'].push(book);

    //console.log(jsonLD);
    let data = JSON.stringify(jsonLD, null, 2);

    fs.writeFileSync('new.jsonld', data, {mode: 0o755});
    console.log('done');
  });

});