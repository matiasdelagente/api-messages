function define(name, value) {
  Object.defineProperty(exports, name, {
    value      : value,
    enumerable : true
  });
}

/* Campaign status */
define('CAMPAIGN_RECEIVED',       0);
define('CAMPAIGN_PROCESSING',     1);
define('CAMPAIGN_DELIVERED',      2);
define('CAMPAIGN_DELIVERY_ERROR', 3);
/* Message status */
define('MSG_RECIVED',             0);
define('MSG_PROCESSING',          1);
define('MSG_DELIVERED',           2);
define('MSG_ACK',                 3);
define('MSG_READED',              4);
define('MSG_SPAM',                5);
define('MSG_REG_PRIORITY',        9);
/* Users status */
define('USER_UNVERIFIED',         0);
define('USER_ACTIVE',             1);
define('USER_INACTIVE',           2);
define('USER_PRO',                3);
define('USER_REVENUE',            4);
define('USER_BLOCK',              5);
/* Clients types */
define('CLI_UNVERIFIED',          0);
define('CLI_VALIDATED',           1);
define('CLI_FREE',                2);
/* Flags */
define('DRY_RUN',                 0);
define('PUSH_ONLY',               1);
define('SMS_ONLY',                2);
define('PUSH_AND_SMS',            3);
define('CAPTURED',                4);
define("CAPTURED_PUSH",           5);