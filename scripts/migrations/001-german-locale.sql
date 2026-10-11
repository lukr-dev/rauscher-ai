-- For the original German-only starter database, before creating translations.
-- Back up first: the single-language starter stored its German content as "en".
BEGIN;
UPDATE ec_pages SET locale = 'de' WHERE locale = 'en';
UPDATE ec_posts SET locale = 'de' WHERE locale = 'en';
UPDATE _emdash_menus SET locale = 'de' WHERE locale = 'en';
UPDATE _emdash_menu_items SET locale = 'de' WHERE locale = 'en';
UPDATE _emdash_taxonomy_defs SET locale = 'de' WHERE locale = 'en';
UPDATE taxonomies SET locale = 'de' WHERE locale = 'en';
UPDATE _emdash_bylines SET locale = 'de' WHERE locale = 'en';
COMMIT;
