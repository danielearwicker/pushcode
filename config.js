
module.exports = {
    
    port: 81,

    targetMachines: [{
        localName: 'earwicker',
        defaultBuild: 'v1p3',
        remoteName: 'earwicker.cloudapp.net',
        loggingDir: 'C:\\Users\\danielearwicker\\AppData\\Local\\PRISYMSetupLogs'
    }, {
        localName: 'p360trunk',
        defaultBuild: 'trunk',
        remoteName: 'p360trunk',
        loggingDir: 'C:\\Users\\Administrator\\AppData\\Local\\PRISYMSetupLogs'
    }],

    jenkins: {
        builds: {
            trunk: 'http://10.0.0.36:8080/job/NextGenTrunkBuild/lastSuccessfulBuild/artifact/ProductInstallation/InstallerOutput/',
            v1p3: 'http://10.0.0.36:8080/job/NextGenProductV13/'
        },
        auth: {
            username: 'danielearwicker',
            password: '****',
            sendImmediately: true
        }
    },
    
    uninstall: {
        program: '"C:\\Program Files\\PRISYM 360\\InstallationState\\setup.exe"',
        arguments: ['/uninstall', 'AllPagesNext=1']
    },
    
    databases: [{
        user: 'sa',
        password: 'Help8585',
        database: 'P360MAIN'
    },{
        user: 'sa',
        password: 'Help8585',
        database: 'P360AUDIT'
    }],
    
    startOfLog: 'Installing',
    endOfLog: 'Leaving Main'
};

