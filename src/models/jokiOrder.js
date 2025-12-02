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
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tiktok_username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      whatsapp_number: {
        type: DataTypes.STRING,
        allowNull: true,
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
      hooks: {
        beforeCreate: (order) => {
          // Enkripsi data sebelum disimpan
          order.username = encrypt(order.username);
          order.password = encrypt(order.password);
          if (order.tiktok_username) {
            order.tiktok_username = encrypt(order.tiktok_username);
          }
          if (order.whatsapp_number) {
            order.whatsapp_number = encrypt(order.whatsapp_number);
          }
        },
        beforeUpdate: (order) => {
          // Enkripsi data sebelum diupdate
          if (order.changed('username')) {
            order.username = encrypt(order.username);
          }
          if (order.changed('password')) {
            order.password = encrypt(order.password);
          }
          if (order.changed('tiktok_username') && order.tiktok_username) {
            order.tiktok_username = encrypt(order.tiktok_username);
          }
          if (order.changed('whatsapp_number') && order.whatsapp_number) {
            order.whatsapp_number = encrypt(order.whatsapp_number);
          }
        },
      },
    }
  );

  return JokiOrder;
};
