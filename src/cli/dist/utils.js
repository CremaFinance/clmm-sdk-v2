"use strict";
exports.__esModule = true;
exports.catchFinallyExit = exports.makeSDK = void 0;
var utils_1 = require("../../tests/utils");
var clmmpool_client_impl_1 = require("../impl/clmmpool-client-impl");
var context_1 = require("../context");
var process_1 = require("process");
// import * as fs from "fs";
// import { parse } from "yaml";
// import { SignerWallet } from "@saberhq/solana-contrib";
var anchor = require("@project-serum/anchor");
function makeSDK() {
    // const home: string | undefined = process.env.HOME;
    // console.log(home, 'home##')
    // const configFile = fs.readFileSync(
    //     `/Users/weijianming/.config/solana/cli/config.yml`,
    //     "utf8"
    // );
    console.log(1, '11');
    // const config = parse(configFile);
    // const url = getURL(config.json_rpc_url);
    console.log(2, '22');
    // const wallet = new SignerWallet(keypairFromFile(config.keypair_path));
    console.log(3, '33');
    var provider = utils_1.loadProvider();
    console.log(4, '44');
    var program = anchor.workspace.Clmmpool;
    console.log(5, '55');
    var ctx = context_1.ClmmpoolContext.fromWorkspace(provider, program);
    console.log(6, '66');
    var sdk = new clmmpool_client_impl_1.ClmmpoolClientImpl(ctx);
    console.log(sdk, 'sdk###');
    return sdk;
}
exports.makeSDK = makeSDK;
function catchFinallyExit(pending) {
    pending["catch"](function (err) {
        console.log(err);
    })["finally"](function () {
        process_1.exit(0);
    });
}
exports.catchFinallyExit = catchFinallyExit;
