const { response } = require('express');
const session = require('express-session');
const mongo = require('../services/lib/mongo');
const FileService = require('../services/files.service');
const fetch = require('node-fetch');

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

const fieldsToExclude = ['key', 'url'];

const excludeFields = (obj, fields) => {
    fields.forEach(field => delete obj[field]);
    return obj;
};

const excludeFieldsFromArray = (arr, fields) => {
    return arr.map(item => excludeFields(item.toObject(), fields));
};

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

        const fileObject = fileCreated.toObject();
        const sanitizedFileObject = excludeFields(fileObject, fieldsToExclude);
        
        res.status(200).json(sanitizedFileObject);
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
        
        const fileObject = fileCreated.toObject();
        const sanitizedFileObject = excludeFields(fileObject, fieldsToExclude);

        res.status(200).json(sanitizedFileObject);
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

        const fileObject = file.toObject();
        const sanitizedFileObject = excludeFields(fileObject, fieldsToExclude);

        res.status(200).json(sanitizedFileObject);

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

        await FileService.delete(file._id, req.session.user._id);
        res.status(200).json({ notification: { message: req.i18n.t('files.controller.file_deleted'), type: 'success' } });

    } catch (error) {
        next(error);
    }
}

async function getCurrentCompanyFiles(req, res) {
    try {
        const files = await FileService.getLinkedToACompanyId(req.session.current_company._id);
        const sanitizedFiles = excludeFieldsFromArray(files, fieldsToExclude);
        res.status(200).json(sanitizedFiles);
    } catch(error) {
        next(error);
    }
}

async function upload(req, res) {
    try {
        // Check if there was an error from the middleware
        if (req.fileError) {
            console.log('req.fileError', req.fileError);
            return res.status(400).json({
                notification: { 
                    message: req.i18n.t(req.fileError.message), 
                    type: 'error' 
                }
            });
        }

        // Check if upload result exists
        if (!req.uploadResult) {
            return res.status(500).json({
                notification: { 
                    message: req.i18n.t('files.controller.upload_failed'), 
                    type: 'error' 
                }
            });
        }

        res.status(200).json({
            notification: { 
                message: req.i18n.t('files.controller.file_uploaded_successfuly'), 
                type: 'success' 
            },
            data: req.uploadResult
        });
    } catch (error) {
        console.error('File upload controller error:', error);
        res.status(500).json({
            notification: { 
                message: req.i18n.t('files.controller.upload_failed'), 
                type: 'error',
                details: error.message 
            }
        });
    }
}

async function update(req, res, next) {
    try {
        let file = await FileService.getBySlug(req.body.value.slug);
        if (!file) {
            return next({ status: 404, message: 'File not found' });
        }

        const { default_attached_document_types, ...otherValues } = req.body.value;


        let updatedFile = await FileService.update(file._id, file.company_id, {
            ...otherValues,
            default_attached_document_types: default_attached_document_types
        });
        console.log('updatedFile', updatedFile);
        updatedFile = updatedFile.toObject();
        updatedFile.autosave_updated_at = req.body.value.autosave_updated_at;

        const sanitizedFile = excludeFields(updatedFile, fieldsToExclude);

        res.status(200).json(sanitizedFile);

    } catch (error) {
        next(error);
    }
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

async function downloadFile(req, res, next) {
    try {
        const slug = req.params.slug;
        
        // Get file
        const file = await FileService.getBySlug(slug);
        if (!file) {
            return next({ 
                status: 404, 
                message: 'File not found',
                notification: { 
                    message: req.i18n.t('files.controller.file_not_found'), 
                    type: 'error'
                }
            });
        }

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: file.key
        };

        try {
            const command = new GetObjectCommand(params);
            const data = await s3Client.send(command);

            res.setHeader('Content-Type', data.ContentType);
            res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);

            await streamPipeline(data.Body, res);
        } catch (s3Error) {
            console.error(`S3 error for file ${slug}:`, s3Error);
            return next({
                status: 500,
                message: 'Download error',
                notification: { 
                    message: req.i18n.t('files.controller.error_downloading_file'), 
                    type: 'error'
                }
            });
        }

    } catch (error) {
        console.error(`General error downloading file ${req.params.slug}:`, error);
        return next({
            status: 500,
            message: error.message,
            notification: { 
                message: req.i18n.t('files.controller.error_downloading_file'), 
                type: 'error'
            }
        });
    }
}

  async function serveFile(req, res, next) {
    let slug;
    try {
        slug = req.params.slug; 
        console.log('slug', slug);
        const file = await FileService.getBySlug(slug);
        console.log('file', file);
        if (!file) {
            console.error(`serveFile: file not found (${slug}):`);
            return next({ 
                status: 404, 
                notification: { message: req.i18n.t('files.controller.file_not_found'), type: 'error'}
            });
        }
        const key = file.key;
        const bucketName = process.env.AWS_S3_BUCKET; // Bucket name from environment variables

        const params = {
            Bucket: bucketName,
            Key: key
        };

        const command = new GetObjectCommand(params);
        const data = await s3Client.send(command);

        // Set caching headers
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.setHeader('ETag', data.ETag);
        res.setHeader('Content-Type', data.ContentType);

        await streamPipeline(data.Body, res);
    } catch (error) {
        console.error(`serveFile: Error serving file (${slug}):`, error);
        res.status(500).json({ notification: { message: req.i18n.t('files.controller.error_serving_file'), type: 'error' } });
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
    serveFile,
    getCurrentCompanyFiles
};