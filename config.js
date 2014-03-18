
module.exports = {
    
    port: 81,

    targetMachine: 'earwicker.cloudapp.net',

    loggingDir: 'C:\\Users\\danielearwicker\\AppData\\Local\\PRISYMSetupLogs',

    jenkinsUrl: 'http://10.0.0.36:8080/job/NextGenTrunkBuild/lastSuccessfulBuild/artifact/ProductInstallation/InstallerOutput/',
    jenkinsAuth: {
        username: 'danielearwicker',
        password: 'password',
        sendImmediately: true
    },

    endOfLog: '\nLeaving Main'
};

