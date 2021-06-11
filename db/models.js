const { DataTypes, Sequelize, belongsTo } = require("sequelize");

module.exports = {
  // RoleAssignment: {
  //   attributes: {
  //     id: {
  //       type: DataTypes.UUIDV4,
  //       defaultValue: Sequelize.UUIDV4,
  //       unique: true,
  //       primaryKey: true
  //     }
  //   },
  //   relations: [],
  //   options: {},
  // }

  Setup: {
    attributes: {
      _id: {
        type: DataTypes.UUIDV4,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        primaryKey: true
      },
      file_name:{
        type: DataTypes.STRING,
        defaultValue: ""
      },
      sim_version: {
        type: DataTypes.STRING,
        defaultValue: ""
      },
      best_time: {
        type: DataTypes.STRING,
        defaultValue: ""
      },
      comments: {
        type: DataTypes.STRING,
        defaultValue: ""
      },
      type: {
        type: DataTypes.STRING,
        defaultValue: ""
      },
      rating: {
        type: DataTypes.STRING,
        defaultValue: ""
      },
      file_data: {
        type: DataTypes.BLOB('long')
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: "1"
      },
      downloads: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    relations: [
      {
        relation: "belongsTo",
        model: "Car"
      },
      {
        relation: "belongsTo",
        model: "Track"
      },
      {
        relation: "belongsTo",
        model: "Sim"
      },
      {
        relation: "belongsTo",
        model: "User"
      },
      {
        relation: "hasMany",
        model: "Rating"
      }
    ]
  },

  Rating: {
    attributes: {
      _id: {
        type: DataTypes.UUIDV4,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        primaryKey: true
      },
      rating: {
        type: DataTypes.INTEGER
      }
    },
    relations: [
      {
        relation: "belongsTo",
        model: "User"
      },
      {
        relation: "belongsTo",
        model: "Setup"
      }
    ]
  },

  Sim: {
    attributes: {
      _id: {
        type: DataTypes.UUIDV4,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        unique: true
      }
    },
    relations: [
      {
        relation: "hasMany",
        model: "Setup"
      },
      {
        relation: "hasMany",
        model: "SimVersion"
      },
    ]
  },

  SimVersion: {
    attributes: {
      _id: {
        type: DataTypes.UUIDV4,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        primaryKey: true
      },
      version: {
        type: DataTypes.STRING,
        unique: true
      }
    },
  },

  Car: {
    attributes: {
      _id: {
        type: DataTypes.UUIDV4,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        primaryKey: true
      },
      ac_code: {
        type: DataTypes.STRING,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        unique: false
      }
    },
    relations: [
      {
        relation: "hasMany",
        model: "Setup"
      },
    ]
  },

  Track: {
    attributes: {
      _id: {
        type: DataTypes.UUIDV4,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        primaryKey: true
      },
      ac_code: {
        type: DataTypes.STRING,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        unique: false
      }
    },
    relations: [
      {
        relation: "hasMany",
        model: "Setup"
      },
    ]
  },

  User: {
    attributes: {
      _id: {
        type: DataTypes.UUIDV4,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        primaryKey: true
      },
      steam_id: {
        type: DataTypes.STRING,
        defaultValue: "",
        allowNull: false
      },
      display_name: {
        type: DataTypes.STRING,
        defaultValue: "Driver",
        allowNull: false
      },
      public_key: {
        type: DataTypes.STRING,
        defaultValue: "",
        allowNull: false
      }
    },
    relations: [
      {
        relation: "hasMany",
        model: "Setup"
      },
      {
        relation: "hasMany",
        model: "Rating"
      }
    ]
  }
  
};
