
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

    uninstall: {
        program: '"C:\\Program Files\\PRISYM 360\\InstallationState\\setup.exe"',
        arguments: ['/uninstall', 'AllPagesNext=1']
    },
    
    databases: [{
        user: 'sa',
        password: 'Help8585',
        server: 'earwicker',
        database: 'P360MAIN'
    },{
        user: 'sa',
        password: 'Help8585',
        server: 'earwicker',
        database: 'P360AUDIT'
    }],
    
    startOfLog: '\nInstalling',
    endOfLog: '\nLeaving Main'
};

