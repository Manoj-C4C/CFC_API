

// Copyright © 2020 altran Corp. All rights reserved.
//

//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict';
var async = require('async');
var Cloudant = require('@cloudant/cloudant');
const utility = require("../utility/utility");
const weightageService = require("../service/service");
const query = require("../db_query/query");
//var cloudant = Cloudant({url: process.env.CLOUDANT_URL});
//const cloudant = new Cloudant({ url: 'https://633f24c3-b128-4545-845b-6a7171ec5174-bluemix.cloudantnosqldb.appdomain.cloud', plugins: { iamauth: { iamApiKey: 'Fnm4HIcpY38re_vih-x0Wc4QJilVDtJFyjftv4B0iavp' } } });
const cloudant = new Cloudant({ url: 'https://8380f2b2-3885-4d08-b0e2-1ab967504d36-bluemix.cloudantnosqldb.appdomain.cloud', plugins: { iamauth: { iamApiKey: 'kXM-uYt4dOwdIMVZa0GXliG_gHY87ImCYExvStPFT5GF' } } });
var db = cloudant.db.use('c4c_db');;
var doc = null;
const SocketService = require('../service/socketService');


module.exports = {
    // create a document
    createDocument: function (payloadData, callback) {
        var payloadData = {
            _id: utility.createGUI(), name: payloadData.name, gender: payloadData.gender, symptom: [],
            mobileno: payloadData.mobileno, location: payloadData.location, temprature: payloadData.temprature,
            iscovid: false, healthstatus: "none", doctorscreen: [], timestamp: Date.now(), doctorId: "", assignedByOperationId: ""
        };
        // we are specifying the id of the document so we can update and delete it later
        db.insert(payloadData, function (err, data) {
            callback(err, data);
        });
    },

    // read a document
    readDocument: function (id, callback) {
        db.get(id, function (err, data) {
            doc = data;
            callback(err, data);
        });
    },

    // update a document
    updateDocument: (payload, callback) => {
        var response = { success: false };
        var err = null;
        var mobno = payload.user_id.toString();
        // payload.temperature = utility.convertStatustoTemperature(payload.temperature);
        payload["timestamp"] = Date.now();
        delete payload["user_id"];
        // make a change to the document, using the copy we kept from reading it back
        db.find(query.getuserData(mobno)).then(async (respData) => { // db.get(uid, async (err, data) =>{
            var data = respData.docs[0];
            if (data) {
                data.symptom.push(payload);
                var updatedField = await weightageService.updatePatientScore(null, data);
                if (updatedField != null) {
                    data.healthstatus = updatedField.healthstatus;
                    data.currentCovidScore = updatedField.currentCovidScore;
                    if (updatedField.qurantine != undefined)
                        data.qurantine = updatedField.qurantine;
                    if (data.healthstatus == 'positive') {
                        SocketService.sendMessageToClient({
                            type: 'Health_Status',
                            data: data.symptom
                        })
                    }

                }
                db.insert(data, function (err, data) {
                    if (data) {
                        response["success"] = true;
                        callback(err, response);
                    }
                    else {
                        callback(err, response);
                    }
                });
            }
            else {
                callback(err, response);
            }

        });
    },

    // deleting a document
    deleteDocument: function (callback) {
        // supply the id and revision to be deleted
        db.destroy(doc._id, doc._rev, function (err, data) {
            callback(err, data);
        });
    },

    // deleting the database document
    deleteDatabase: function (callback) {
        cloudant.db.destroy(dbname, function (err, data) {
            callback(err, data);
        });
    },
    selectQuery: function () {
        db.find(query.searchQuery()).then((result) => {
        });;
    },
    findsymptom: function (id, callback) {
        db.find(query.getSymptom(id)).then((result) => {
            if (result.docs.length > 0 && result.docs[0].symptom.length > 0) {
                callback(true);
            }
            else {
                callback(false);
            }
        }).catch(err => {
            callback(err);
        });
    },
    getUserName: (id, callback) => {
        db.find(query.getSignIn(id)).then((result) => {
            console.log("Response for get User Name function =>" + JSON.stringify(result));
            if (result.docs.length > 0) {
                callback("", { "sucess": "true", userName: result.docs[0].name, userId: result.docs[0]._id });
            }
            else {
                callback("", { "sucess": "false" });
            }
        }).catch(err => {
            callback(err, { "sucess": "false" });
        });
    }
};
