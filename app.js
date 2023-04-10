$(document).ready(
    function() {

        $(".form-group-time-quantum").hide();

        // Show hide RR time quantum
        $('#algorithmSelector').on('change', function() {
            if (this.value === 'optRR') {
                $(".form-group-time-quantum").show(1000);
            } else {
                $(".form-group-time-quantum").hide(1000);
            }
        });


        var processList = [];

        $('#btnAddProcess').on('click', function() {
            var processID = $('#processID');
            var arrivalTime = $('#arrivalTime');
            var burstTime = $('#burstTime');

            if (processID.val() === '' || arrivalTime.val() === '' || burstTime.val() === '') {
                processID.addClass('is-invalid');
                arrivalTime.addClass('is-invalid');
                burstTime.addClass('is-invalid');
                return;
            }

            var process = {
                processID: parseInt(processID.val(), 10),
                arrivalTime: parseInt(arrivalTime.val(), 10),
                burstTime: parseInt(burstTime.val(), 10)
            }

            processList.push(process);

            $('#tblProcessList > tbody:last-child').append(
                `<tr>
                    <td id="tdProcessID">${processID.val()}</td>
                    <td id="tdArrivalTime">${arrivalTime.val()}</td>
                    <td id="tdBurstTime">${burstTime.val()}</td>
                </tr>`
            );

            processID.val('');
            arrivalTime.val('');
            burstTime.val('');
        });

        $('#btnCalculate').on('click', function() {

            if (processList.length == 0) {
                alert('Please insert some processes');
                return;
            }

            var selectedAlgo = $('#algorithmSelector').children('option:selected').val();

            if (selectedAlgo === 'optFCFS') {
                firstComeFirstServed();
            }

            if (selectedAlgo === 'optSJF') {
                shortestJobFirst();
            }

            if (selectedAlgo === 'optSRTF') {
                shortestRemainingTimeFirst();
            }

            if (selectedAlgo === 'optRR') {
                roundRobin();
            }
        });

        function firstComeFirstServed() {
            var time = 0;
            var queue = [];
            var completedList = [];

            while (processList.length > 0 || queue.length > 0) {
                while (queue.length == 0) {
                    time++;
                    addToQueue();
                }

                // Dequeue from queue and run the process.
                process = queue.shift();
                for (var i = 0; i < process.burstTime; i++) {
                    time++
                    addToQueue();
                }
                process.completedTime = time;
                process.turnAroundTime = process.completedTime - process.arrivalTime;
                process.waitingTime = process.turnAroundTime - process.burstTime;
                completedList.push(process);
            }

            function addToQueue() {
                for (var i = 0; i < processList.length; i++) {
                    if (time >= processList[i].arrivalTime) {
                        var process = {
                            processID: processList[i].processID,
                            arrivalTime: processList[i].arrivalTime,
                            burstTime: processList[i].burstTime
                        }
                        processList.splice(i, 1);
                        queue.push(process);
                    }
                }
            }

            // Bind table data
            let grafProcessId = [];
            let grafArrivalTime = [];
            let grafBurstTime = [];
            let grafWaitingTime = [];
            let grafTurnAroundTime = [];
            let grafCompletedTime = [];



            $.each(completedList, function(key, process) {

                grafProcessId.push(process.processID)
                grafArrivalTime.push(process.arrivalTime)
                grafBurstTime.push(process.burstTime)
                grafCompletedTime.push(process.completedTime)
                grafWaitingTime.push(process.waitingTime)
                grafTurnAroundTime.push(process.turnAroundTime)

                $('#tblResults > tbody:last-child').append(
                    `<tr>
                        <td id="tdProcessID">${process.processID}</td>
                        <td id="tdArrivalTime">${process.arrivalTime}</td>
                        <td id="tdBurstTime">${process.burstTime}</td>
                        <td id="tdBurstTime">${process.completedTime}</td>
                        <td id="tdBurstTime">${process.waitingTime}</td>
                        <td id="tdBurstTime">${process.turnAroundTime}</td>
                    </tr>`
                );
            });
            const ctx = document.getElementById('myChart');

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: grafProcessId,
                    datasets: [{
                            label: 'Waktu Kedatangan',
                            data: grafArrivalTime,
                            borderColor: '#fc0328',
                            backgroundColor: '#fc0328',
                        },
                        {
                            label: 'Waktu Eksekusi',
                            data: grafBurstTime,
                            borderColor: '#2003fc',
                            backgroundColor: '#2003fc'
                        },
                        {
                            label: 'Waktu Selesai',
                            data: grafCompletedTime,
                            borderColor: 'rgba(252,202,3)',
                            backgroundColor: 'rgba(252,202,3)',
                        },
                        {
                            label: 'Waktu Menunggu',
                            data: grafWaitingTime,
                            borderColor: '#069116',
                            backgroundColor: '#069116',
                        },
                        {
                            label: 'Waktu Penyelesaian',
                            data: grafTurnAroundTime,
                            borderColor: '#151515',
                            backgroundColor: '#151515',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Grafik First Come First Services'
                        }
                    }
                },
            });

            // Get average
            var avgTurnaroundTime = 0;
            var avgWaitingTime = 0;
            var maxCompletedTime = 0;

            $.each(completedList, function(key, process) {
                if (process.completedTime > maxCompletedTime) {
                    maxCompletedTime = process.completedTime;
                }
                avgTurnaroundTime = avgTurnaroundTime + process.turnAroundTime;
                avgWaitingTime = avgWaitingTime + process.waitingTime;
            });

            $('#avgTurnaroundTime').val(avgTurnaroundTime / completedList.length);
            $('#avgWaitingTime').val(avgWaitingTime / completedList.length);
            $('#throughput').val(completedList.length / maxCompletedTime);
        }

        function shortestJobFirst() {
            var completedList = [];
            var time = 0;
            var queue = [];

            while (processList.length > 0 || queue.length > 0) {
                addToQueue();
                while (queue.length == 0) {
                    time++;
                    addToQueue();
                }
                processToRun = selectProcess();
                for (var i = 0; i < processToRun.burstTime; i++) {
                    time++;
                    addToQueue();
                }
                processToRun.processID = processToRun.processID;
                processToRun.arrivalTime = processToRun.arrivalTime;
                processToRun.burstTime = processToRun.burstTime;
                processToRun.completedTime = time;
                processToRun.turnAroundTime = processToRun.completedTime - processToRun.arrivalTime;
                processToRun.waitingTime = processToRun.turnAroundTime - processToRun.burstTime;
                completedList.push(processToRun);
            }

            function addToQueue() {
                for (var i = 0; i < processList.length; i++) {
                    if (processList[i].arrivalTime === time) {
                        var process = {
                            processID: processList[i].processID,
                            arrivalTime: processList[i].arrivalTime,
                            burstTime: processList[i].burstTime
                        }
                        processList.splice(i, 1);
                        queue.push(process);
                    }
                }
            }

            function selectProcess() {
                if (queue.length != 0) {
                    queue.sort(function(a, b) {
                        if (a.burstTime > b.burstTime) {
                            return 1;
                        } else {
                            return -1;
                        }
                    });
                }
                var process = queue.shift();
                return process;
            }

            // Bind table data
            let grafProcessId = [];
            let grafArrivalTime = [];
            let grafBurstTime = [];
            let grafWaitingTime = [];
            let grafTurnAroundTime = [];
            let grafCompletedTime = [];

            $.each(completedList, function(key, process) {

                grafProcessId.push(process.processID)
                grafArrivalTime.push(process.arrivalTime)
                grafBurstTime.push(process.burstTime)
                grafCompletedTime.push(process.completedTime)
                grafWaitingTime.push(process.waitingTime)
                grafTurnAroundTime.push(process.turnAroundTime)


                $('#tblResults > tbody:last-child').append(
                    `<tr>
                        <td id="tdProcessID">${process.processID}</td>
                        <td id="tdArrivalTime">${process.arrivalTime}</td>
                        <td id="tdBurstTime">${process.burstTime}</td>
                        <td id="tdBurstTime">${process.completedTime}</td>
                        <td id="tdBurstTime">${process.waitingTime}</td>
                        <td id="tdBurstTime">${process.turnAroundTime}</td>
                    </tr>`
                );
            });

            const ctx = document.getElementById('myChart');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: grafProcessId,
                    datasets: [{
                            label: 'Arrival Time',
                            data: grafArrivalTime,
                            borderColor: '#fc0328',
                            backgroundColor: '#fc0328',
                        },
                        {
                            label: 'Burst Time',
                            data: grafBurstTime,
                            borderColor: '#2003fc',
                            backgroundColor: '#2003fc'
                        },
                        {
                            label: 'Completed Time',
                            data: grafCompletedTime,
                            borderColor: 'rgba(252,202,3)',
                            backgroundColor: 'rgba(252,202,3)',
                        },
                        {
                            label: 'Waiting Time',
                            data: grafWaitingTime,
                            borderColor: '#069116',
                            backgroundColor: '#069116',
                        },
                        {
                            label: 'TurnAroundTime',
                            data: grafTurnAroundTime,
                            borderColor: '#151515',
                            backgroundColor: '#151515',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Grafik Shortest Job First'
                        }
                    }
                },
            });


            // Get average
            var avgTurnaroundTime = 0;
            var avgWaitingTime = 0;
            var maxCompletedTime = 0;
            var throughput = 0;

            $.each(completedList, function(key, process) {
                if (process.completedTime > maxCompletedTime) {
                    maxCompletedTime = process.completedTime;
                }
                avgTurnaroundTime = avgTurnaroundTime + process.turnAroundTime;
                avgWaitingTime = avgWaitingTime + process.waitingTime;
            });

            $('#avgTurnaroundTime').val(avgTurnaroundTime / completedList.length);
            $('#avgWaitingTime').val(avgWaitingTime / completedList.length);
            $('#throughput').val(completedList.length / maxCompletedTime);
        }

        function shortestRemainingTimeFirst() {
            var completedList = [];
            var time = 0;
            var queue = [];

            while (processList.length > 0 || queue.length > 0) {
                addToQueue();
                while (queue.length == 0) {
                    time++;
                    addToQueue();
                }
                selectProcessForSRTF();
                runSRTF();
            }

            function addToQueue() {
                for (var i = 0; i < processList.length; i++) {
                    if (processList[i].arrivalTime === time) {
                        var process = {
                            processID: processList[i].processID,
                            arrivalTime: processList[i].arrivalTime,
                            burstTime: processList[i].burstTime
                        }
                        processList.splice(i, 1);
                        queue.push(process);
                    }
                }
            }

            function selectProcessForSRTF() {
                if (queue.length != 0) {
                    queue.sort(function(a, b) {
                        if (a.burstTime > b.burstTime) {
                            return 1;
                        } else {
                            return -1;
                        }
                    });
                    if (queue[0].burstTime == 1) {
                        process = queue.shift();
                        process.completedTime = time + 1;
                        completedList.push(process);

                    } else if (queue[0].burstTime > 1) {
                        process = queue[0];
                        queue[0].burstTime = process.burstTime - 1;
                    }
                }
            }

            function runSRTF() {
                time++;
                addToQueue();
            }

            // Fetch table data
            var TableData = [];
            $('#tblProcessList tr').each(function(row, tr) {
                TableData[row] = {
                    "processID": parseInt($(tr).find('td:eq(0)').text()),
                    "arrivalTime": parseInt($(tr).find('td:eq(1)').text()),
                    "burstTime": parseInt($(tr).find('td:eq(2)').text())
                }
            });

            // Remove header row
            TableData.splice(0, 1);

            // Reset burst time
            TableData.forEach(pInTable => {
                completedList.forEach(pInCompleted => {
                    if (pInTable.processID == pInCompleted.processID) {
                        pInCompleted.burstTime = pInTable.burstTime;
                        pInCompleted.turnAroundTime = pInCompleted.completedTime - pInCompleted.arrivalTime;
                        pInCompleted.waitingTime = pInCompleted.turnAroundTime - pInCompleted.burstTime;
                    }
                });
            });

            // Bind table data
            let grafProcessId = [];
            let grafArrivalTime = [];
            let grafBurstTime = [];
            let grafWaitingTime = [];
            let grafTurnAroundTime = [];
            let grafCompletedTime = [];

            $.each(completedList, function(key, process) {
                grafProcessId.push(process.processID)
                grafArrivalTime.push(process.arrivalTime)
                grafBurstTime.push(process.burstTime)
                grafCompletedTime.push(process.completedTime)
                grafWaitingTime.push(process.waitingTime)
                grafTurnAroundTime.push(process.turnAroundTime)

                $('#tblResults > tbody:last-child').append(
                    `<tr>
                        <td id="tdProcessID">${process.processID}</td>
                        <td id="tdArrivalTime">${process.arrivalTime}</td>
                        <td id="tdBurstTime">${process.burstTime}</td>
                        <td id="tdBurstTime">${process.completedTime}</td>
                        <td id="tdBurstTime">${process.waitingTime}</td>
                        <td id="tdBurstTime">${process.turnAroundTime}</td>
                    </tr>`
                );
            });
            const ctx = document.getElementById('myChart');

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: grafProcessId,
                    datasets: [{
                            label: 'Arrival Time',
                            data: grafArrivalTime,
                            borderColor: '#fc0328',
                            backgroundColor: '#fc0328',
                        },
                        {
                            label: 'Burst Time',
                            data: grafBurstTime,
                            borderColor: '#2003fc',
                            backgroundColor: '#2003fc'
                        },
                        {
                            label: 'Completed Time',
                            data: grafCompletedTime,
                            borderColor: 'rgba(252,202,3)',
                            backgroundColor: 'rgba(252,202,3)',
                        },
                        {
                            label: 'Waiting Time',
                            data: grafWaitingTime,
                            borderColor: '#069116',
                            backgroundColor: '#069116',
                        },
                        {
                            label: 'TurnAroundTime',
                            data: grafTurnAroundTime,
                            borderColor: '#151515',
                            backgroundColor: '#151515',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Grafik Shortest Remaining Time First'
                        }
                    }
                },
            });

            // Get average
            var avgTurnaroundTime = 0;
            var avgWaitingTime = 0;
            var maxCompletedTime = 0;
            var throughput = 0;

            $.each(completedList, function(key, process) {
                if (process.completedTime > maxCompletedTime) {
                    maxCompletedTime = process.completedTime;
                }
                avgTurnaroundTime = avgTurnaroundTime + process.turnAroundTime;
                avgWaitingTime = avgWaitingTime + process.waitingTime;
            });

            $('#avgTurnaroundTime').val(avgTurnaroundTime / completedList.length);
            $('#avgWaitingTime').val(avgWaitingTime / completedList.length);
            $('#throughput').val(completedList.length / maxCompletedTime);
        }

        function roundRobin() {
            var timeQuantum = $('#timeQuantum');
            var timeQuantumVal = parseInt(timeQuantum.val(), 10);
            if (timeQuantum.val() == '') {
                alert('Please enter time quantum');
                timeQuantum.addClass('is-invalid');
                return;
            }
            var completedList = [];
            var time = 0;
            var queue = [];

            while (processList.length > 0 || queue.length > 0) {
                addToQueue();
                while (queue.length == 0) {
                    time++;
                    addToQueue();
                }
                selectProcessForRR();
            }

            function addToQueue() {
                for (var i = 0; i < processList.length; i++) {
                    if (processList[i].arrivalTime === time) {
                        var process = {
                            processID: processList[i].processID,
                            arrivalTime: processList[i].arrivalTime,
                            burstTime: processList[i].burstTime
                        }
                        processList.splice(i, 1);
                        queue.push(process);
                    }
                }
            }

            function selectProcessForRR() {
                if (queue.length != 0) {
                    queue.sort(function(a, b) {
                        if (a.burstTime > b.burstTime) {
                            return 1;
                        } else {
                            return -1;
                        }
                    });

                    if (queue[0].burstTime < timeQuantumVal) {
                        process = queue.shift();
                        process.completedTime = time + process.burstTime;

                        for (var index = 0; index < process.burstTime; index++) {
                            time++;
                            addToQueue();
                        }
                        completedList.push(process);

                    } else if (queue[0].burstTime == timeQuantumVal) {
                        process = queue.shift();
                        process.completedTime = time + timeQuantumVal;
                        completedList.push(process);

                        for (var index = 0; index < timeQuantumVal; index++) {
                            time++;
                            addToQueue();
                        }
                    } else if (queue[0].burstTime > timeQuantumVal) {
                        process = queue[0];
                        queue[0].burstTime = process.burstTime - timeQuantumVal;

                        for (var index = 0; index < timeQuantumVal; index++) {
                            time++;
                            addToQueue();
                        }
                    }
                }
            }

            // Fetch initial table data
            var TableData = [];
            $('#tblProcessList tr').each(function(row, tr) {
                TableData[row] = {
                    "processID": parseInt($(tr).find('td:eq(0)').text()),
                    "arrivalTime": parseInt($(tr).find('td:eq(1)').text()),
                    "burstTime": parseInt($(tr).find('td:eq(2)').text())
                }
            });

            // Remove table header row
            TableData.splice(0, 1);

            // Reset burst time from original input table.
            TableData.forEach(pInTable => {
                completedList.forEach(pInCompleted => {
                    if (pInTable.processID == pInCompleted.processID) {
                        pInCompleted.burstTime = pInTable.burstTime;
                        pInCompleted.turnAroundTime = pInCompleted.completedTime - pInCompleted.arrivalTime;
                        pInCompleted.waitingTime = pInCompleted.turnAroundTime - pInCompleted.burstTime;
                    }
                });
            });

            // Bind table data
            let grafProcessId = [];
            let grafArrivalTime = [];
            let grafBurstTime = [];
            let grafWaitingTime = [];
            let grafTurnAroundTime = [];
            let grafCompletedTime = [];

            $.each(completedList, function(key, process) {

                grafProcessId.push(process.processID)
                grafArrivalTime.push(process.arrivalTime)
                grafBurstTime.push(process.burstTime)
                grafCompletedTime.push(process.completedTime)
                grafWaitingTime.push(process.waitingTime)
                grafTurnAroundTime.push(process.turnAroundTime)


                $('#tblResults > tbody:last-child').append(
                    `<tr>
                        <td id="tdProcessID">${process.processID}</td>
                        <td id="tdArrivalTime">${process.arrivalTime}</td>
                        <td id="tdBurstTime">${process.burstTime}</td>
                        <td id="tdBurstTime">${process.completedTime}</td>
                        <td id="tdBurstTime">${process.waitingTime}</td>
                        <td id="tdBurstTime">${process.turnAroundTime}</td>
                    </tr>`
                );
            });
            const ctx = document.getElementById('myChart');

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: grafProcessId,
                    datasets: [{
                            label: 'Arrival Time',
                            data: grafArrivalTime,
                            borderColor: '#fc0328',
                            backgroundColor: '#fc0328',
                        },
                        {
                            label: 'Burst Time',
                            data: grafBurstTime,
                            borderColor: '#2003fc',
                            backgroundColor: '#2003fc'
                        },
                        {
                            label: 'Completed Time',
                            data: grafCompletedTime,
                            borderColor: 'rgba(252,202,3)',
                            backgroundColor: 'rgba(252,202,3)',
                        },
                        {
                            label: 'Waiting Time',
                            data: grafWaitingTime,
                            borderColor: '#069116',
                            backgroundColor: '#069116',
                        },
                        {
                            label: 'TurnAroundTime',
                            data: grafTurnAroundTime,
                            borderColor: '#151515',
                            backgroundColor: '#151515',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Grafik Round Robin'
                        }
                    }
                },
            });

            // Get average
            var totalTurnaroundTime = 0;
            var totalWaitingTime = 0;
            var maxCompletedTime = 0;

            $.each(completedList, function(key, process) {
                if (process.completedTime > maxCompletedTime) {
                    maxCompletedTime = process.completedTime;
                }
                totalTurnaroundTime = totalTurnaroundTime + process.turnAroundTime;
                totalWaitingTime = totalWaitingTime + process.waitingTime;
            });

            $('#avgTurnaroundTime').val(totalTurnaroundTime / completedList.length);
            $('#avgWaitingTime').val(totalWaitingTime / completedList.length);
            $('#throughput').val(completedList.length / maxCompletedTime);

        }
    }
);