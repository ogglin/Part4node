var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var crypto = require('crypto');

var jsonParser = bodyParser.json();
var multer = require('multer');
var multipart = multer();
const {Pool} = require('pg');
const pool = new Pool({
    host: '116.203.219.63',
    //host: 'localhost',
    port: 5432,
    //database: 'zapchasty',
    database: 'zapchasty',
    user: 'zapchasty',
    password: 'zapchasty_GfhjkzYtn321',
});

const salt = '!23209daw312_d21';
/* Connect to BD */

router.get('/', function (req, res, next) {
    res.render('api', {result: 'RestAPI'});
});

/* Auth */
var token;
router.post('/auth', multipart.array(), function (req, res) {
    email = req.body.email;
    pass = req.body.password;
    ip = req.connection.remoteAddress;
    hash = crypto.createHmac('sha256', salt).update(crypto.createHmac('sha256', salt).update(pass).digest('hex')).digest('hex');
    token = crypto.randomBytes(16).toString('hex');
    body = {
        token: token,
        ipaddr: ip,
        password: hash
    };
    q = 'SELECT "user".auth_key, "user".username FROM "user" WHERE "user".email = \'' + email + '\' AND ' +
        '"user".password_hash = \'' + hash + '\'';
    /*return res.send(q);*/
    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(q);
            body = {
                token: result.rows[0]['auth_key'],
                username: result.rows[0]['username']
            };
            return res.send(body);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
});

/* Get all brands */
var brands;
router.get('/brands', function (req, res) {
    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM brands');
            brands = result.rows;
            return res.send(brands);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
});

/* Get models by brand id */
var models;
router.get('/models', function (req, res) {
    console.log(req.query, req.query['brand_id']);
    qq = "SELECT models.id, models.name, models.scheme_picture, models.picture " +
        "FROM models " +
        "WHERE models.brand_id = " + req.query["brand_id"];
    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(qq);
            models = result.rows;
            return res.send(models);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
});

/* Get details by model id */
var details;
router.get('/details', function (req, res) {
    qq = 'SELECT details."id", details."name", details.analogs, details.partcode_id, details.base_image, details.name_ru, details.priority, details.module_id, details.all_model_id, details.consumables, details.seo ' +
        'FROM details WHERE details.all_model_id = ' + req.query["modelId"];
    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(qq);
            details = result.rows;
            return res.send(details);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
});

/* Get detail options by detail id */
var detail;
router.get('/detail', function (req, res) {
    qq = 'SELECT detail_options."id" as option_id, detail_options.parent_id as parent_id, spr_detail_options."name" as option_name, detail_options."name" as option_value, detail_options.icon \n' +
        'FROM details, detail_options LEFT JOIN spr_detail_options ON detail_options.spr_detail_option_id = spr_detail_options."id" LEFT JOIN link_details_options ON link_details_options.detail_option_id = detail_options."id" \n' +
        'WHERE link_details_options.detail_id = details."id" AND details."id" =' + req.query["id"];
    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(qq);
            detail = result.rows;
            return res.send(detail);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
});

/* Get module by detail id*/
var modules;
router.get('/modules', function (req, res) {
    qq = 'SELECT modules."id", modules."name" AS "module", modules.description, modules.scheme_picture ' +
        'FROM modules LEFT JOIN link_model_modules ON link_model_modules.module_id = modules."id" LEFT JOIN models ON link_model_modules.model_id = models."id" ' +
        'WHERE models."id" = ' + req.query["id"];

    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(qq);
            modules = result.rows;
            return res.send(modules);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
});

/* Get partcodes by model and module id's */
var partcodes;
router.get('/partcodes', function (req, res) {
    if (req.query['module']) {
        qq = 'SELECT details."id" AS detail_id, details."name" AS detail_name, details.name_ru AS detail_name_ru, ' +
            'partcodes.code AS partcode, partcodes.description AS partcodes_description, ' +
            'models."name" AS model, models.scheme_picture AS model_shceme, models.picture AS model_image, ' +
            'modules."name" AS module, modules.scheme_picture AS module_image ' +
            'FROM details ' +
            'LEFT JOIN partcodes ON details.partcode_id = partcodes."id" ' +
            'LEFT JOIN models ON details.all_model_id = models."id" ' +
            'LEFT JOIN link_model_modules ON link_model_modules.model_id = models."id" ' +
            'INNER JOIN modules ON details.module_id = modules."id" AND link_model_modules.module_id = modules."id" ' +
            'WHERE models."id" = ' + req.query["model"] + ' AND modules."id" = ' + req.query['module'];
    } else {
        qq = 'SELECT details."id" AS detail_id, details."name" AS detail_name, details.name_ru AS detail_name_ru, ' +
            'partcodes.code AS partcode, partcodes.description AS partcodes_description, ' +
            'models."name" AS model, models.scheme_picture AS model_shceme, models.picture AS model_image, ' +
            'modules."name" AS module, modules.scheme_picture AS module_image ' +
            'FROM details ' +
            'LEFT JOIN partcodes ON details.partcode_id = partcodes."id" ' +
            'LEFT JOIN models ON details.all_model_id = models."id" ' +
            'LEFT JOIN link_model_modules ON link_model_modules.model_id = models."id" ' +
            'INNER JOIN modules ON details.module_id = modules."id" AND link_model_modules.module_id = modules."id" ' +
            'WHERE models."id" = ' + req.query["model"];
    }
    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(qq);
            partcodes = result.rows;
            return res.send(partcodes);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
});

/* Search by request */
var q;
var answer;
var qq;
router.post('/search', multipart.array(), function (req, res) {
    if (!req.body) return res.sendStatus(400);
    /*svals = req.body.sval;
    avals = svals.split(' ');*/
    console.log(req.body.sval);
    qs = "select * from details_search('"+req.body.sval+"') as (sml real, ts_rank real, detail_id bigint, detail_name text, detail_name_ru text) limit 20;";
    /*for (let i = 0; i < avals.length; i++) {
        if (i === 0) {
            qq += 'details."name" ILIKE(\'%' + avals[i] + '%\')';
        } else {
            qq += ' AND details."name" ILIKE(\'%' + avals[i] + '%\')';
        }
    }
    q = 'SELECT s.id as detail_id, s.name as detail_name, d.name_ru as detail_name_ru, d.base_image as image, p.code as partcode, m.name as module, m.id as module_id ' +
        'FROM search_index s left join details d on s.id=d.id ' +
        'left join partcodes p on d.partcode_id = p.id ' +
        'left join modules m on d.module_id = m.id ' +
        'WHERE document @@ websearch_to_tsquery(\'english\', \'' + svals + '\') ' +
        'ORDER BY ts_rank(document, websearch_to_tsquery(\'english\', \'' + svals + '\')) DESC LIMIT 20;';*/
    /*q = 'SELECT details.*, partcodes.code, partcodes.description, models."name" as model_name, models.scheme_picture, models.picture, media.link, media.title ' +
        'FROM details ' +
        'LEFT JOIN partcodes ON details.partcode_id = partcodes. ID ' +
        'LEFT JOIN models ON details.all_model_id = models. ID ' +
        'LEFT JOIN media ON details. ID = media.detail_id WHERE ' + qq;*/
    /*q = 'SELECT details.name, details.id, partcodes.code, partcodes.description, ' +
        'ts_rank(to_tsvector(\'russian_en\', COALESCE(partcodes.code,\'\')||\' \'|| COALESCE(details. NAME,\'\')), websearch_to_tsquery(\'russian_en\',\'scanners cover\')) rank ' +
        'FROM details  ' +
        'LEFT JOIN partcodes ON details.partcode_id = partcodes. ID  ' +
        'WHERE to_tsvector(\'russian_en\',  COALESCE(partcodes.code,\'\')||\' \'||  COALESCE(details. NAME,\'\'))  ' +
        '@@ websearch_to_tsquery(\'russian_en\',\'scanners cover\') ' +
        'ORDER BY rank LIMIT 5 OFFSET 0;';
    /*q = 'SELECT details.*, partcodes.code, partcodes.description, models.name as model_name, models.picture, models.scheme_picture, media.link, media.title, ts_rank(to_tsvector(\'russian_en\', ' +
        'COALESCE(models. NAME,\'\')||\' \'|| COALESCE(partcodes.code,\'\')||\' \'|| COALESCE(details. NAME,\'\')||\' \'|| ' +
        'COALESCE(details. NAME_RU,\'\')), websearch_to_tsquery(\'russian_en\',\'' + svals + '\')) rank FROM details ' +
        'LEFT JOIN partcodes ON details.partcode_id = partcodes. ID ' +
        'LEFT JOIN models ON details.all_model_id = models. ID ' +
        'LEFT JOIN media ON details. ID = media.detail_id WHERE to_tsvector(\'russian_en\', ' +
        'COALESCE(models. NAME,\'\')||\' \'|| COALESCE(partcodes.code,\'\')||\' \'||  ' +
        'COALESCE(details. NAME,\'\')||\' \'|| COALESCE(details. NAME_RU,\'\')) ' +
        '@@ websearch_to_tsquery(\'russian_en\',\'' + svals + '\') ORDER BY rank LIMIT 5000 OFFSET 0;';*/
    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(qs);
            answer = result.rows;
            return res.send(answer);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
});

/* Filter models by options */
var filtered_models;
router.post('/filter', multipart.array(), function (req, res) {
    fvals = req.body.vals;
    count = (fvals.split(',')).length;
    qq = 'SELECT d."id", sd."name" FROM spr_details sd LEFT JOIN details d on sd."id" = d.detail_id ' +
        'LEFT JOIN models m ON m.id = d.model_id LEFT JOIN link_details_options ldo ON ldo.detail_id = d."id" ' +
        'LEFT JOIN detail_options dop ON ldo.detail_option_id = dop."id" LEFT JOIN brands b on b.id = m.brand_id ' +
        'WHERE dop."id" IN (' + fvals + ') ';
    if (req.body.brand) {
        qq += ' AND b.id = ' + req.body.brand;
    }
    qq += 'GROUP BY sd."name", d."id" HAVING COUNT(*) = ' + count;
    console.log(qq);
    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(qq);
            filtered_models = result.rows;
            return res.send(filtered_models);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
})
;

/* Filter options */
var filter;
router.get('/filter', function (req, res) {
    main = req.query['main'];
    q = 'SELECT * FROM filter_settings WHERE filter_settings.main_filter =' + main;
    console.log(q);
    (async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(q);
            filter = result.rows;
            return res.send(filter);
        } finally {
            client.release()
        }
    })().catch(e => console.log(e.stack));
});

module.exports = router;
