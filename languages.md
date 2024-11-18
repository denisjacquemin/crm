Language company

1. On signup la select language prend la langue de l'interface par defaut
2. Le user est créé avec la language de l'interface
3. Creation de la compagnie language vaut par default ensuite creation avec la langue selectionnée sur l'ecran signup
4. Creation d'un seller, prednre la langue du pays du seller, le pays par default est celle de la compagnie courante, si le pays change la langue change
5. Creatuin d'un customer (byer) prendre lalangue du pays du buyer, le pays par defaulkt est celle de la compagniue courant, si lepays change la llangue change

Langue du document

6. A la creation, la langue de la compagnie courrant sinon la langue de l'interface
7. Proposer de changer la langue si le client a une languqye differente, ou pas je ne sais pas

1. usersController.js#signup2 const defaultLanguage = req.i18n.language.split("-")[0] || process.env.DEFAULT_LANGUAGE

2. usersController.js#signup1Post req.session.signup.user = {
    ...
    language: req.i18n.language.split("-")[0] || process.env.DEFAULT_LANGUAGE,
  };

3. usersController.js#signup2Post req.session.signup.company = {
      ...companyData,

companyData contient language 

4. companiesController.js#newCompanyAjax 
const companyCreated = await CompanyService.create({
    ...
    country: req.session.current_company.country,
  });

5. buyersController.js#createNewBuyer 
const buyerData = {
            
            country: req.session.current_company.country,
            delivery_country: req.session.current_company.country
        };

6. documentsController.js#createCommonDocument
    const documentLanguage = process.env.TRANSLATION_i18_CODE.split(',').includes(req.session.current_company.language)
        ? req.session.current_company.language
        : req.i18n.language;

7. TBD