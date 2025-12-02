const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize, DataTypes) => {
  const JokiOrder = sequelize.define(
    'jokiOrder',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          this.setDataValue('username', encrypt(value));
        },
        get() {
          const rawValue = this.getDataValue('username');
          return decrypt(rawValue);
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          this.setDataValue('password', encrypt(value));
        },
        get() {
          const rawValue = this.getDataValue('password');
          return decrypt(rawValue);
        },
      },
      // Kolom baru
      tiktok_username: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          this.setDataValue('tiktok_username', value ? encrypt(value) : null);
        },
        get() {
          const rawValue = this.getDataValue('tiktok_username');
          return rawValue ? decrypt(rawValue) : null;
        },
      },
      whatsapp_number: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          this.setDataValue('whatsapp_number', value ? encrypt(value) : null);
        },
        get() {
          const rawValue = this.getDataValue('whatsapp_number');
          return rawValue ? decrypt(rawValue) : null;
        },
      },
      jenis_joki: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bukti_transfer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'joki_orders',
    }
  );

  return JokiOrder;
};
