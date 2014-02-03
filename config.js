
module.exports = {
    
    port: 3123,

    targetMachine: 'localhost',

    loggingDir: 'C:\\Users\\Administrator\\AppData\\Local\\PRISYMSetupLogs',

    jenkinsUrl: 'http://10.0.0.36:8080/job/NextGenTrunkBuild/lastSuccessfulBuild/artifact/ProductInstallation/InstallerOutput/',
    jenkinsAuth: {
        username: 'danielearwicker',
        password: 'password',
        sendImmediately: true
    },

    endOfLog: '\nLeaving Main'
};

