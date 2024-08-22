const { response } = require('express');
const session = require('express-session');
const mongo = require('../services/lib/mongo');
const FileService = require('../services/files.service');
const fetch = require('node-fetch');


async function newFileAjax(req, res, next) {
    try {
        const fileCreated = await FileService.create({
            slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
            company_id: req.session.current_company._id,
            created_by_user_id: req.session.user._id,
            name: req.i18n.t('files.controller.default_file_name'),
            internal_name: '',
            size: '',
            type: '',
            filename: ''
        });
        
        res.status(200).json(fileCreated.toObject());
    } catch (error) {
        next(error);
    }
}

async function newFileAjaxForADocument(req, res, next) {
    try {
        const fileCreated = await FileService.create({
            slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
            company_id: req.session.current_company._id,
            document_id: req.body.document_id,
            created_by_user_id: req.session.user._id,
            name: req.i18n.t('files.controller.default_file_name'),
            internal_name: '',
            size: '',
            type: '',
            filename: ''
        });
        
        res.status(200).json(fileCreated.toObject());
    } catch (error) {
        next(error);
    }
}

async function editAjax(req, res, next) {

    try {
        const file = await FileService.getBySlug(req.params.slug);
        if (!file) {
            return next({ 
                status: 404, 
                notification: { message: req.i18n.t('files.controller.file_not_found'), type: 'error'}
            });
        }

        res.status(200).json(file.toObject());

    } catch (error) {
        next(error);
    }
};

async function deleteAjax(req, res, next) {
    try {
        const file = await FileService.getBySlug(req.params.slug);
        if (!file) {
            return next({ 
                status: 404, 
                notification: { message: req.i18n.t('files.controller.file_not_found'), type: 'error'}
            });
        }

        await FileService.delete(file._id);
        res.status(200).json({ notification: { message: req.i18n.t('files.controller.file_deleted'), type: 'success' } });

    } catch (error) {
        next(error);
    }
}

async function getCurrentCompanyFiles(req, res) {
    try {
        const files = await FileService.getLinkedToACompanyId(req.session.current_company._id);
        res.status(200).json(files);
    } catch(error) {
        next(error);
    }
}

async function upload(req, res) {
    res.status(200).send({
        message: 'File uploaded successfully',
        data: req.uploadResult
    });
};



//     const { url, key, size, type, filename } = req.uploadResult;

//     const fileData = {
//         slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
//         company_id: req.session.current_company._id,
//         document_id: req.body.document_id,
//         created_by_user_id: req.session.user._id,
//         name: req.i18n.t('files.controller.default_file_name'),
//         internal_name: '',
//         size: size,
//         type: type,
//         filename: filename,
//         key: key,
//         url: url
//     };

//     // Check if the file exists
//     let fileFromDB;
//     let existingFile;
//     if (req.body.file_id) {
//         existingFile = await FileService.getById({ _id: req.body.file_id });
//     }

//     if (existingFile) {
//         // Update existing file
//         Object.assign(existingFile, fileData);
//         fileFromDB = await FileService.update(existingFile._id, fileData);
//     } else {
//         // Create new file
//         fileFromDB = await FileService.create(fileData);
//     }

//     console.log('fileFromDB', fileFromDB)

//     res.status(200).json(fileFromDB);
// }

async function update(req, res, next) {
    try {
        let file = await FileService.getBySlug(req.body.value.slug);

        if (!file) {
            return next({ status: 404, message: 'File not found' });
        }
        
        let updatedFile = await FileService.update(file._id, req.session.current_company._id, req.body.value);
        updatedFile = updatedFile.toObject();

        updatedFile.autosave_updated_at = req.body.value.autosave_updated_at;
        res.status(200).json(updatedFile);

    } catch (error) {
        next(error);
    }
}


async function downloadFile(req, res, next) {
    try {
        const fileSlug = req.params.slug;
        const file = await FileService.getBySlug(fileSlug);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = file.url; // full S3 URL

        // Fetch the file from the URL
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        // Set the headers and send the file to the client
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        response.body.pipe(res);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    newFileAjax,
    newFileAjaxForADocument,
    editAjax,
    deleteAjax,
    upload,
    update,
    downloadFile,
    getCurrentCompanyFiles
};