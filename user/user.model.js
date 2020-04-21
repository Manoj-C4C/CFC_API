

// Copyright © 2015, 2017 IBM Corp. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict';


// load the Cloudant library
var async = require('async');
var Cloudant = require('@cloudant/cloudant');
const utility = require("../utility/utility");
const cloudant = new Cloudant({ url: 'https://633f24c3-b128-4545-845b-6a7171ec5174-bluemix.cloudantnosqldb.appdomain.cloud', plugins: { iamauth: { iamApiKey: 'Fnm4HIcpY38re_vih-x0Wc4QJilVDtJFyjftv4B0iavp' } } });
var db = cloudant.db.use('c4c_db');
var doc = null;

module.exports = {

    // create a document
    createDocument: function (payloadData, callback) {
        var pwd = utility.createPWD();
        var encryptedPwd = utility.encrypt(pwd);
        var qurantineData = { "isQurantine": false, "started": 0, "end": 0 };
        var payloadData = {
            _id: utility.createGUI(), name: payloadData.name, gender: payloadData.gender,
            age: payloadData.age, mobileno: payloadData.mobileno, location: payloadData.location, currentAssign : "none",
            morbidity: "none", isTestPerformed: true,
            password: encryptedPwd, symptom: [], iscovid: false, healthstatus: "none", doctorscreening: [],
            timestamp: Date.now(), doctorId: "", assignedByOperator: {}, assignedByDoctor: {}, usertype: "individual",
            qurantine: qurantineData, currentCovidScore: ""
        };
        // we are specifying the id of the document so we can update and delete it later
        db.insert(payloadData, function (err, data) {
            var response = {};
            if (data) {
                response["success"] = true;
                response["userId"] = data.id;
                response["password"] = pwd;

            }
            else {
                response["success"] = false;
            }
            callback(err, response);
        });
    },

    // read a document
    readDocument: function (userId, callback) {
        db.get(userId, function (err, data) {
            data["userId"]=data._id;
            delete data._id;
            delete data.password;
            delete data._rev;
            callback(err, data);
        });
    },

    // update a document
    updateDocument: function (callback) {
        // make a change to the document, using the copy we kept from reading it back
        doc.c = true;
        db.insert(doc, function (err, data) {
            console.log('Error:', err);
            console.log('Data:', data);
            // keep the revision of the update so we can delete it
            doc._rev = data.rev;
            callback(err, data);
        });
    },

    authentication: function (payload, callback) {
        db.get(payload.id, function (err, data) {
            if (data) {
                // console.log(utility.decrypt(data.password));
                // if (payload.password == utility.decrypt(data.password)) {
                //     callback(err, { userId: payload.id, success: true });
                // }
                // else {
                callback(err, { userId: payload.id, success: true });
                //}
            }
            else {
                callback(err, { userId: payload.id, success: false });
            }
        });

    },


};
